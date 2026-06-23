import { env } from '../config/env.js';
import { DEFAULT_CITIES, DEFAULT_QUALITIES } from '../config/market.js';
import { isDatabaseConfigured } from '../database/connection.js';
import { findMarketHistory } from '../models/marketPriceModel.js';
import { findArbitrageOpportunities } from '../services/arbitrageService.js';
import { calculateItemCraftingProfit, rankCraftingOpportunities } from '../services/craftingService.js';
import { findItems } from '../services/itemService.js';
import { fetchMarketPrices } from '../services/marketService.js';
import { parseBoolean, parseCsv, parseNumber } from '../utils/query.js';

const resolveItemIds = (query, { craftingOnly = false } = {}) => {
  const explicitItems = parseCsv(query.items);
  if (explicitItems.length) return explicitItems;
  return findItems({ category: query.category, tier: query.tier })
    .filter((item) => !craftingOnly || ['Armas', 'Armaduras'].includes(item.category))
    .map((item) => item.itemId);
};

export const getPrices = async (request, response) => {
  const result = await fetchMarketPrices({
    itemIds: resolveItemIds(request.query),
    cities: parseCsv(request.query.cities, DEFAULT_CITIES),
    qualities: parseCsv(request.query.qualities, DEFAULT_QUALITIES).map(Number),
    server: request.query.server || 'europe',
    minimumPrice: parseNumber(request.query.minimumPrice, 0, { min: 0 }),
    minimumMargin: parseNumber(request.query.minimumMargin, null),
  });
  response.json(result);
};

export const getArbitrage = async (request, response) => {
  const cities = parseCsv(request.query.cities, DEFAULT_CITIES);
  const result = await findArbitrageOpportunities({
    itemIds: resolveItemIds(request.query),
    cities,
    qualities: parseCsv(request.query.qualities, [1]).map(Number),
    server: request.query.server || 'europe',
    marketTaxRate: parseNumber(request.query.marketTaxRate, env.defaultMarketTax, { min: 0, max: 1 }),
    minimumProfit: parseNumber(request.query.minimumProfit, 0, { min: 0 }),
    minimumMargin: parseNumber(request.query.minimumMargin, 0),
    originCity: request.query.originCity,
    destinationCity: request.query.destinationCity,
    limit: parseNumber(request.query.limit, 100, { min: 1, max: 500 }),
  });
  response.json(result);
};

export const getCraftingProfit = async (request, response) => {
  const common = {
    materialCity: request.query.materialCity || 'Caerleon',
    saleCity: request.query.saleCity || 'Caerleon',
    craftCity: request.query.craftCity || request.query.materialCity || 'Caerleon',
    server: request.query.server || 'europe',
    stationFeeRate: parseNumber(request.query.stationFeeRate, 0, { min: 0, max: 1 }),
    resourceReturnRate: parseNumber(request.query.resourceReturnRate, 0, { min: 0, max: 0.95 }),
    marketTaxRate: parseNumber(request.query.marketTaxRate, env.defaultMarketTax, { min: 0, max: 1 }),
    useFocus: parseBoolean(request.query.useFocus),
  };

  const result = request.query.itemId
    ? await calculateItemCraftingProfit({
      ...common,
      itemId: request.query.itemId,
      quantity: parseNumber(request.query.quantity, 1, { min: 1, max: 100000 }),
    })
    : await rankCraftingOpportunities({
      ...common,
      itemIds: resolveItemIds(request.query, { craftingOnly: true }),
      limit: parseNumber(request.query.limit, 10, { min: 1, max: 50 }),
    });
  response.json(result);
};

export const getHistory = async (request, response) => {
  const data = await findMarketHistory({
    itemId: request.query.itemId,
    city: request.query.city,
    server: request.query.server,
    category: request.query.category,
    tier: request.query.tier,
    limit: parseNumber(request.query.limit, 250, { min: 1, max: 1000 }),
  });
  response.json({
    data,
    meta: {
      count: data.length,
      persistenceConfigured: isDatabaseConfigured(),
    },
  });
};
