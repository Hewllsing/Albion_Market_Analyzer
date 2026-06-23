import { DEFAULT_CITIES } from '../config/market.js';
import { env } from '../config/env.js';
import { itemById } from '../data/items.js';
import { refiningRecipeByItemId, refiningRecipes } from '../data/refiningRecipes.js';
import { AppError } from '../utils/AppError.js';
import { calculateOpportunityScore, estimateOpportunityRisk, getOpportunityRecommendation } from '../utils/opportunity.js';
import { calculateCraftingProfit, getRecommendation } from '../utils/profit.js';
import { fetchMarketPrices } from './marketService.js';

const selectLowestSell = (prices, itemId, city) => prices
  .filter((price) => price.itemId === itemId && price.city === city && price.sellPriceMin > 0)
  .sort((first, second) => first.sellPriceMin - second.sellPriceMin)[0];

export const calculateItemRefiningProfit = async ({
  itemId,
  materialCity = 'Bridgewatch',
  saleCity = 'Caerleon',
  quantity = 1,
  stationFeeRate = 0,
  resourceReturnRate = 0.152,
  marketTaxRate = env.defaultMarketTax,
  server = 'europe',
}) => {
  const recipe = refiningRecipeByItemId.get(itemId);
  if (!recipe) throw new AppError('Nao ha receita de refino cadastrada para este item.', 404);

  const itemIds = [itemId, ...recipe.materials.map((material) => material.itemId)];
  const locations = [...new Set([materialCity, saleCity].filter(Boolean))];
  const result = await fetchMarketPrices({ itemIds, cities: locations, qualities: [1], server });
  const materialPrices = recipe.materials.map((material) => {
    const price = selectLowestSell(result.data, material.itemId, materialCity);
    if (!price) throw new AppError(`Sem preco de venda para ${material.itemId} em ${materialCity}.`, 422);
    return {
      ...material,
      itemName: itemById.get(material.itemId)?.name || material.itemId,
      unitPrice: price.sellPriceMin,
      updatedAt: price.sellPriceMinDate,
    };
  });
  const outputPrice = selectLowestSell(result.data, itemId, saleCity);
  if (!outputPrice) throw new AppError(`Sem preco de venda para ${itemId} em ${saleCity}.`, 422);

  const profit = calculateCraftingProfit({
    materials: materialPrices,
    quantity,
    salePrice: outputPrice.sellPriceMin,
    marketTaxRate,
    stationFeeRate,
    resourceReturnRate,
  });
  const updatedAtDates = [
    outputPrice.sellPriceMinDate,
    ...materialPrices.map((material) => material.updatedAt),
  ].filter(Boolean);
  const risk = estimateOpportunityRisk({
    purchaseCity: materialCity,
    saleCity,
    updatedAtDates,
    hasImmediateSale: false,
    marginPercent: profit.marginPercent,
  });
  const opportunityScore = calculateOpportunityScore({
    marginPercent: profit.marginPercent,
    risk,
    updatedAtDates,
    hasImmediateSale: false,
    netProfit: profit.netProfit,
  });

  return {
    data: {
      itemId,
      itemName: itemById.get(itemId)?.name || itemId,
      category: itemById.get(itemId)?.category || 'Recursos refinados',
      tier: itemById.get(itemId)?.tier,
      materialCity,
      saleCity,
      quantity,
      resourceReturnRate,
      marketTaxRate,
      stationFeeRate,
      salePrice: outputPrice.sellPriceMin,
      salePriceUpdatedAt: outputPrice.sellPriceMinDate,
      materials: materialPrices,
      ...profit,
      recommendation: getRecommendation(profit.marginPercent, profit.netProfit),
      risk,
      opportunityScore,
      opportunityRecommendation: getOpportunityRecommendation(opportunityScore),
    },
    meta: result.meta,
  };
};

export const rankRefiningOpportunities = async ({
  itemIds = refiningRecipes.map((recipe) => recipe.itemId),
  materialCity = 'Bridgewatch',
  saleCity = 'Caerleon',
  server = 'europe',
  marketTaxRate = env.defaultMarketTax,
  stationFeeRate = 0,
  resourceReturnRate = 0.152,
  limit = 10,
}) => {
  const selectedRecipes = itemIds.filter((itemId) => refiningRecipeByItemId.has(itemId));
  const settled = await Promise.allSettled(selectedRecipes.map((itemId) =>
    calculateItemRefiningProfit({
      itemId,
      materialCity,
      saleCity,
      quantity: 1,
      stationFeeRate,
      resourceReturnRate,
      marketTaxRate,
      server,
    })));

  const data = settled
    .filter((entry) => entry.status === 'fulfilled')
    .map((entry) => entry.value.data)
    .sort((first, second) => second.opportunityScore - first.opportunityScore || second.netProfit - first.netProfit)
    .slice(0, limit);

  return {
    data,
    meta: {
      attempted: selectedRecipes.length,
      calculated: data.length,
      unavailable: settled.filter((entry) => entry.status === 'rejected').length,
      server,
      availableCities: DEFAULT_CITIES,
    },
  };
};
