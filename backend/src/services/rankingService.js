import { BLACK_MARKET_CITY, DEFAULT_CITIES } from '../config/market.js';
import { env } from '../config/env.js';
import { marketItems } from '../data/items.js';
import { findPriceDropOpportunities } from '../models/marketPriceModel.js';
import { calculateOpportunityScore, estimateOpportunityRisk, getOpportunityRecommendation } from '../utils/opportunity.js';
import { calculateArbitrage } from '../utils/profit.js';
import { findArbitrageOpportunities } from './arbitrageService.js';
import { rankCraftingOpportunities } from './craftingService.js';
import { findItems } from './itemService.js';
import { fetchMarketPrices } from './marketService.js';
import { rankRefiningOpportunities } from './refiningService.js';

const safeRanking = async (name, task) => {
  try {
    return await task();
  } catch (error) {
    return { data: [], meta: { name, error: error.message } };
  }
};

const idsByCategories = (categories) => findItems({ scope: 'market' })
  .filter((item) => categories.includes(item.category))
  .map((item) => item.itemId);

const buildHighMarginRanking = async ({
  server,
  marketTaxRate,
  limit,
}) => {
  const result = await fetchMarketPrices({
    itemIds: marketItems.map((item) => item.itemId),
    cities: DEFAULT_CITIES,
    qualities: [1],
    server,
  });
  const grouped = new Map();
  result.data.forEach((price) => {
    const key = `${price.itemId}:${price.quality}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(price);
  });

  const candidates = [];
  grouped.forEach((prices) => {
    prices.forEach((purchase) => {
      if (purchase.sellPriceMin <= 0) return;
      prices.forEach((sale) => {
        if (sale.city === purchase.city || sale.buyPriceMax <= 0) return;
        const profit = calculateArbitrage({
          purchasePrice: purchase.sellPriceMin,
          salePrice: sale.buyPriceMax,
          marketTaxRate,
        });
        if (profit.netProfit <= 0) return;

        const updatedAtDates = [purchase.sellPriceMinDate, sale.buyPriceMaxDate].filter(Boolean);
        const risk = estimateOpportunityRisk({
          purchaseCity: purchase.city,
          saleCity: sale.city,
          updatedAtDates,
          hasImmediateSale: true,
          marginPercent: profit.marginPercent,
        });
        const opportunityScore = calculateOpportunityScore({
          marginPercent: profit.marginPercent,
          risk,
          updatedAtDates,
          hasImmediateSale: true,
          netProfit: profit.netProfit,
        });

        candidates.push({
          type: 'margin',
          itemId: purchase.itemId,
          itemName: purchase.itemName,
          category: purchase.category,
          tier: purchase.tier,
          purchaseCity: purchase.city,
          saleCity: sale.city,
          purchasePrice: purchase.sellPriceMin,
          salePrice: sale.buyPriceMax,
          updatedAt: sale.buyPriceMaxDate || purchase.sellPriceMinDate,
          ...profit,
          risk,
          opportunityScore,
          opportunityRecommendation: getOpportunityRecommendation(opportunityScore),
        });
      });
    });
  });

  const data = candidates
    .sort((first, second) => second.marginPercent - first.marginPercent || second.opportunityScore - first.opportunityScore)
    .slice(0, limit);

  return {
    data,
    meta: { ...result.meta, opportunityCount: candidates.length },
  };
};

const buildPriceDropRanking = async ({ server, limit }) => {
  const rows = await findPriceDropOpportunities({ server, limit });
  const data = rows.map((row) => {
    const risk = estimateOpportunityRisk({
      purchaseCity: row.city,
      saleCity: row.city,
      updatedAtDates: [row.createdAt].filter(Boolean),
      hasImmediateSale: false,
      priceVariationPercent: row.dropPercent,
      marginPercent: row.dropPercent,
    });
    const opportunityScore = calculateOpportunityScore({
      marginPercent: row.dropPercent,
      risk,
      updatedAtDates: [row.createdAt].filter(Boolean),
      hasImmediateSale: false,
      netProfit: row.dropAmount,
    });

    return {
      type: 'price-drop',
      itemId: row.itemId,
      itemName: row.itemName,
      category: row.category,
      tier: row.tier,
      city: row.city,
      quality: row.quality,
      currentPrice: row.sellPriceMin,
      averagePrevious: row.averagePrevious,
      dropAmount: row.dropAmount,
      dropPercent: row.dropPercent,
      sampleSize: row.sampleSize,
      updatedAt: row.createdAt,
      risk,
      opportunityScore,
      opportunityRecommendation: getOpportunityRecommendation(opportunityScore),
    };
  });

  return { data, meta: { opportunityCount: data.length, server } };
};

export const getOpportunityRankings = async ({
  server = 'europe',
  marketTaxRate = env.defaultMarketTax,
  limit = 10,
}) => {
  const gearIds = idsByCategories(['Armas', 'Armaduras']);
  const consumableIds = idsByCategories(['Pocoes', 'Comidas']);

  const [
    arbitrageTop,
    craftingTop,
    refiningTop,
    consumablesTop,
    blackMarketTop,
    priceDropsTop,
    marginTop,
  ] = await Promise.all([
    safeRanking('arbitrageTop', () => findArbitrageOpportunities({
      itemIds: marketItems.map((item) => item.itemId),
      cities: DEFAULT_CITIES,
      qualities: [1],
      server,
      marketTaxRate,
      minimumProfit: 1,
      limit,
      sortBy: 'score',
    })),
    safeRanking('craftingTop', () => rankCraftingOpportunities({
      server,
      marketTaxRate,
      materialCity: 'Caerleon',
      saleCity: 'Caerleon',
      limit,
    })),
    safeRanking('refiningTop', () => rankRefiningOpportunities({
      server,
      marketTaxRate,
      materialCity: 'Bridgewatch',
      saleCity: 'Caerleon',
      limit,
    })),
    safeRanking('consumablesTop', () => findArbitrageOpportunities({
      itemIds: consumableIds,
      cities: DEFAULT_CITIES,
      qualities: [1],
      server,
      marketTaxRate,
      minimumProfit: 1,
      limit,
      sortBy: 'score',
    })),
    safeRanking('blackMarketTop', () => findArbitrageOpportunities({
      itemIds: gearIds,
      cities: [...DEFAULT_CITIES, BLACK_MARKET_CITY],
      qualities: [1],
      server,
      marketTaxRate,
      destinationCity: BLACK_MARKET_CITY,
      minimumProfit: 1,
      limit,
      sortBy: 'score',
    })),
    safeRanking('priceDropsTop', () => buildPriceDropRanking({ server, limit })),
    safeRanking('marginTop', () => buildHighMarginRanking({ server, marketTaxRate, limit })),
  ]);

  const combined = [
    ...arbitrageTop.data.map((entry) => ({ ...entry, type: 'arbitrage' })),
    ...craftingTop.data.map((entry) => ({ ...entry, type: 'crafting' })),
    ...refiningTop.data.map((entry) => ({ ...entry, type: 'refining' })),
    ...consumablesTop.data.map((entry) => ({ ...entry, type: 'consumable' })),
    ...blackMarketTop.data.map((entry) => ({ ...entry, type: 'black-market' })),
    ...priceDropsTop.data,
    ...marginTop.data,
  ].sort((first, second) => second.opportunityScore - first.opportunityScore).slice(0, limit);

  return {
    data: {
      overallTop: combined,
      arbitrageTop: arbitrageTop.data,
      craftingTop: craftingTop.data,
      refiningTop: refiningTop.data,
      consumablesTop: consumablesTop.data,
      blackMarketTop: blackMarketTop.data,
      priceDropsTop: priceDropsTop.data,
      marginTop: marginTop.data,
    },
    meta: {
      server,
      limit,
      marketTaxRate,
      fetchedAt: new Date().toISOString(),
      sections: {
        arbitrageTop: arbitrageTop.meta,
        craftingTop: craftingTop.meta,
        refiningTop: refiningTop.meta,
        consumablesTop: consumablesTop.meta,
        blackMarketTop: blackMarketTop.meta,
        priceDropsTop: priceDropsTop.meta,
        marginTop: marginTop.meta,
      },
    },
  };
};
