import { DEFAULT_CITIES } from '../config/market.js';
import { env } from '../config/env.js';
import { itemById } from '../data/items.js';
import { recipeByItemId, recipes } from '../data/recipes.js';
import { AppError } from '../utils/AppError.js';
import { calculateCraftingProfit, getRecommendation } from '../utils/profit.js';
import { fetchMarketPrices } from './marketService.js';

const selectLowestSell = (prices, itemId, city) => prices
  .filter((price) => price.itemId === itemId && price.city === city && price.sellPriceMin > 0)
  .sort((first, second) => first.sellPriceMin - second.sellPriceMin)[0];

const selectCompetitiveSale = (prices, itemId, city) => prices
  .filter((price) => price.itemId === itemId && price.city === city && price.sellPriceMin > 0)
  .sort((first, second) => first.sellPriceMin - second.sellPriceMin)[0];

export const calculateItemCraftingProfit = async ({
  itemId,
  materialCity,
  saleCity,
  craftCity,
  quantity = 1,
  stationFeeRate = 0,
  resourceReturnRate = 0,
  marketTaxRate = env.defaultMarketTax,
  useFocus = false,
  server = 'europe',
}) => {
  const recipe = recipeByItemId.get(itemId);
  if (!recipe) throw new AppError('Nao ha receita cadastrada para este item.', 404);

  const effectiveReturnRate = useFocus && resourceReturnRate === 0 ? 0.479 : resourceReturnRate;
  const itemIds = [itemId, ...recipe.materials.map((material) => material.itemId)];
  const locations = [...new Set([materialCity, saleCity, craftCity].filter(Boolean))];
  const result = await fetchMarketPrices({ itemIds, cities: locations, qualities: [1], server });
  const materialPrices = recipe.materials.map((material) => {
    const price = selectLowestSell(result.data, material.itemId, materialCity);
    if (!price) {
      throw new AppError(`Sem preco de venda para ${material.itemId} em ${materialCity}.`, 422);
    }
    return {
      ...material,
      itemName: itemById.get(material.itemId)?.name || material.itemId,
      unitPrice: price.sellPriceMin,
      updatedAt: price.sellPriceMinDate,
    };
  });
  const outputPrice = selectCompetitiveSale(result.data, itemId, saleCity);
  if (!outputPrice) throw new AppError(`Sem preco de venda para ${itemId} em ${saleCity}.`, 422);

  const profit = calculateCraftingProfit({
    materials: materialPrices,
    quantity,
    salePrice: outputPrice.sellPriceMin,
    marketTaxRate,
    stationFeeRate,
    resourceReturnRate: effectiveReturnRate,
  });

  return {
    data: {
      itemId,
      itemName: itemById.get(itemId)?.name || itemId,
      materialCity,
      craftCity,
      saleCity,
      quantity,
      useFocus,
      resourceReturnRate: effectiveReturnRate,
      marketTaxRate,
      stationFeeRate,
      salePrice: outputPrice.sellPriceMin,
      salePriceUpdatedAt: outputPrice.sellPriceMinDate,
      materials: materialPrices,
      ...profit,
      recommendation: getRecommendation(profit.marginPercent, profit.netProfit),
    },
    meta: result.meta,
  };
};

export const rankCraftingOpportunities = async ({
  itemIds = recipes.map((recipe) => recipe.itemId),
  materialCity = 'Caerleon',
  saleCity = 'Caerleon',
  server = 'europe',
  marketTaxRate = env.defaultMarketTax,
  stationFeeRate = 0,
  resourceReturnRate = 0,
  useFocus = false,
  limit = 10,
}) => {
  const selectedRecipes = itemIds.filter((itemId) => recipeByItemId.has(itemId));
  const settled = await Promise.allSettled(selectedRecipes.map((itemId) =>
    calculateItemCraftingProfit({
      itemId,
      materialCity,
      saleCity,
      craftCity: materialCity,
      quantity: 1,
      stationFeeRate,
      resourceReturnRate,
      marketTaxRate,
      useFocus,
      server,
    })));

  const data = settled
    .filter((entry) => entry.status === 'fulfilled')
    .map((entry) => entry.value.data)
    .sort((first, second) => second.netProfit - first.netProfit)
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
