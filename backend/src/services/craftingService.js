import { DEFAULT_CITIES } from '../config/market.js';
import { env } from '../config/env.js';
import { itemById } from '../data/items.js';
import {
  craftingGroups,
  defaultCraftingRankingItemIds,
  recipeByItemId,
  recipes,
} from '../data/recipes.js';
import { AppError } from '../utils/AppError.js';
import { calculateOpportunityScore, estimateOpportunityRisk, getOpportunityRecommendation } from '../utils/opportunity.js';
import { calculateCraftingProfit, getRecommendation } from '../utils/profit.js';
import { fetchMarketPrices } from './marketService.js';

const selectLowestSell = (prices, itemId, city) => prices
  .filter((price) => price.itemId === itemId && price.city === city && price.sellPriceMin > 0)
  .sort((first, second) => first.sellPriceMin - second.sellPriceMin)[0];

const selectCompetitiveSale = (prices, itemId, city) => prices
  .filter((price) => price.itemId === itemId && price.city === city && price.sellPriceMin > 0)
  .sort((first, second) => first.sellPriceMin - second.sellPriceMin)[0];

const DEFAULT_FOCUS_RETURN_RATE = 0.479;

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const normalizeManualMaterialPrices = (manualMaterialPrices = {}) =>
  Object.fromEntries(Object.entries(manualMaterialPrices)
    .map(([itemId, value]) => [itemId, toPositiveNumber(value)])
    .filter(([, value]) => value !== null));

const scenarioRecommendation = (profit, hasMissingPrices) =>
  (hasMissingPrices ? 'Completar precos' : getRecommendation(profit.marginPercent, profit.netProfit));

export const getCraftingItemIdsByGroup = (group, { includeEnchantments = true } = {}) => recipes
  .filter((recipe) => !group || recipe.group === group)
  .filter((recipe) => includeEnchantments || !recipe.itemId.includes('@'))
  .map((recipe) => recipe.itemId);

const emptyPriceResult = ({ server, error }) => ({
  data: [],
  meta: {
    server,
    itemCount: 0,
    priceCount: 0,
    rawPriceCount: 0,
    cacheHit: false,
    partial: true,
    failedItems: [],
    externalError: error?.message || null,
    persistence: { enabled: false, saved: 0, error: null },
    fetchedAt: new Date().toISOString(),
  },
});

const fetchCraftingPrices = async ({ itemIds, locations, server }) => {
  try {
    return await fetchMarketPrices({ itemIds, cities: locations, qualities: [1], server });
  } catch (error) {
    if (error.statusCode !== 502) throw error;

    const settled = await Promise.allSettled(itemIds.map((singleItemId) =>
      fetchMarketPrices({
        itemIds: [singleItemId],
        cities: locations,
        qualities: [1],
        server,
        persist: false,
      })));
    const fulfilled = settled.filter((entry) => entry.status === 'fulfilled');
    if (!fulfilled.length) return emptyPriceResult({ server, error });

    const data = fulfilled.flatMap((entry) => entry.value.data);
    const failedItems = itemIds.filter((_, index) => settled[index].status === 'rejected');
    return {
      data,
      meta: {
        ...fulfilled[0].value.meta,
        itemCount: new Set(data.map((price) => price.itemId)).size,
        priceCount: data.length,
        rawPriceCount: data.length,
        cacheHit: fulfilled.every((entry) => entry.value.meta.cacheHit),
        partial: failedItems.length > 0,
        failedItems,
        externalError: error.message,
        persistence: { enabled: false, saved: 0, error: null },
      },
    };
  }
};

export const calculateItemCraftingProfit = async ({
  itemId,
  materialCity,
  saleCity,
  craftCity,
  quantity = 1,
  stationFeeRate = 0,
  resourceReturnRate = 0,
  focusReturnRate = DEFAULT_FOCUS_RETURN_RATE,
  marketTaxRate = env.defaultMarketTax,
  useFocus = false,
  manualMaterialPrices = {},
  manualSalePrice,
  server = 'europe',
}) => {
  const recipe = recipeByItemId.get(itemId);
  if (!recipe) throw new AppError('Nao ha receita cadastrada para este item.', 404);

  const manualPrices = normalizeManualMaterialPrices(manualMaterialPrices);
  const itemIds = [itemId, ...recipe.materials.map((material) => material.itemId)];
  const locations = [...new Set([materialCity, saleCity, craftCity].filter(Boolean))];
  const result = await fetchCraftingPrices({ itemIds, locations, server });
  const materialPrices = recipe.materials.map((material) => {
    const price = selectLowestSell(result.data, material.itemId, materialCity);
    const manualPrice = manualPrices[material.itemId];
    const unitPrice = manualPrice || price?.sellPriceMin || 0;
    return {
      ...material,
      itemName: itemById.get(material.itemId)?.name || material.itemId,
      unitPrice,
      priceSource: manualPrice ? 'manual' : 'market',
      missingPrice: unitPrice <= 0,
      updatedAt: manualPrice ? null : price?.sellPriceMinDate,
    };
  });
  const outputPrice = selectCompetitiveSale(result.data, itemId, saleCity);
  const salePriceOverride = toPositiveNumber(manualSalePrice);
  const salePrice = salePriceOverride || outputPrice?.sellPriceMin || 0;
  const hasMissingPrices = materialPrices.some((material) => material.missingPrice) || salePrice <= 0;

  const buildScenario = ({ label, returnRate }) => {
    const profit = calculateCraftingProfit({
      materials: materialPrices,
      quantity,
      salePrice,
      marketTaxRate,
      stationFeeRate,
      resourceReturnRate: returnRate,
    });
    return {
      label,
      resourceReturnRate: returnRate,
      ...profit,
      recommendation: scenarioRecommendation(profit, hasMissingPrices),
    };
  };

  const withoutFocus = buildScenario({ label: 'Sem Focus', returnRate: resourceReturnRate });
  const withFocus = buildScenario({ label: 'Com Focus', returnRate: focusReturnRate });
  const selectedProfit = useFocus ? withFocus : withoutFocus;
  const updatedAtDates = [
    outputPrice?.sellPriceMinDate,
    ...materialPrices.map((material) => material.updatedAt),
  ].filter(Boolean);
  const risk = estimateOpportunityRisk({
    purchaseCity: materialCity,
    saleCity,
    updatedAtDates,
    hasImmediateSale: false,
    marginPercent: selectedProfit.marginPercent,
  });
  const opportunityScore = calculateOpportunityScore({
    marginPercent: selectedProfit.marginPercent,
    risk,
    updatedAtDates,
    hasImmediateSale: false,
    netProfit: selectedProfit.netProfit,
  });

  return {
    data: {
      itemId,
      itemName: itemById.get(itemId)?.name || itemId,
      craftGroup: recipe.group,
      materialCity,
      craftCity,
      saleCity,
      quantity,
      useFocus,
      resourceReturnRate: selectedProfit.resourceReturnRate,
      baseResourceReturnRate: resourceReturnRate,
      focusReturnRate,
      marketTaxRate,
      stationFeeRate,
      salePrice,
      salePriceSource: salePriceOverride ? 'manual' : 'market',
      salePriceUpdatedAt: salePriceOverride ? null : outputPrice?.sellPriceMinDate,
      hasMissingPrices,
      missingMaterials: materialPrices.filter((material) => material.missingPrice),
      missingSalePrice: salePrice <= 0,
      focusComparison: {
        withoutFocus,
        withFocus,
      },
      ...selectedProfit,
      risk,
      opportunityScore,
      opportunityRecommendation: getOpportunityRecommendation(opportunityScore),
    },
    meta: result.meta,
  };
};

export const rankCraftingOpportunities = async ({
  itemIds = defaultCraftingRankingItemIds,
  materialCity = 'Caerleon',
  saleCity = 'Caerleon',
  server = 'europe',
  marketTaxRate = env.defaultMarketTax,
  stationFeeRate = 0,
  resourceReturnRate = 0,
  focusReturnRate = DEFAULT_FOCUS_RETURN_RATE,
  useFocus = false,
  craftGroup,
  limit = 10,
}) => {
  const selectedRecipes = itemIds
    .filter((itemId) => recipeByItemId.has(itemId))
    .filter((itemId) => !craftGroup || recipeByItemId.get(itemId).group === craftGroup);
  const settled = await Promise.allSettled(selectedRecipes.map((itemId) =>
    calculateItemCraftingProfit({
      itemId,
      materialCity,
      saleCity,
      craftCity: materialCity,
      quantity: 1,
      stationFeeRate,
      resourceReturnRate,
      focusReturnRate,
      marketTaxRate,
      useFocus,
      server,
    })));

  const data = settled
    .filter((entry) => entry.status === 'fulfilled')
    .map((entry) => entry.value.data)
    .filter((entry) => !entry.hasMissingPrices)
    .sort((first, second) => second.opportunityScore - first.opportunityScore || second.netProfit - first.netProfit)
    .slice(0, limit);

  return {
    data,
    meta: {
      attempted: selectedRecipes.length,
      calculated: data.length,
      unavailable: settled.filter((entry) => entry.status === 'rejected').length,
      server,
      craftGroup,
      craftingGroups,
      availableCities: DEFAULT_CITIES,
    },
  };
};
