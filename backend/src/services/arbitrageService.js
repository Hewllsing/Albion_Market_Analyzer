import { env } from '../config/env.js';
import { calculateOpportunityScore, estimateOpportunityRisk, getOpportunityRecommendation } from '../utils/opportunity.js';
import { calculateArbitrage } from '../utils/profit.js';
import { fetchMarketPrices } from './marketService.js';

export const findArbitrageOpportunities = async ({
  itemIds,
  cities,
  qualities,
  server,
  marketTaxRate = env.defaultMarketTax,
  minimumProfit = 0,
  minimumMargin = 0,
  originCity,
  destinationCity,
  limit = 100,
  sortBy = 'profit',
}) => {
  const result = await fetchMarketPrices({ itemIds, cities, qualities, server });
  const grouped = new Map();

  result.data.forEach((price) => {
    const key = `${price.itemId}:${price.quality}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(price);
  });

  const opportunities = [];
  grouped.forEach((prices) => {
    prices.forEach((purchase) => {
      if (purchase.sellPriceMin <= 0 || (originCity && purchase.city !== originCity)) return;
      prices.forEach((sale) => {
        if (
          sale.buyPriceMax <= 0
          || sale.city === purchase.city
          || (destinationCity && sale.city !== destinationCity)
        ) return;

        const profit = calculateArbitrage({
          purchasePrice: purchase.sellPriceMin,
          salePrice: sale.buyPriceMax,
          marketTaxRate,
        });
        if (profit.netProfit < minimumProfit || profit.marginPercent < minimumMargin) return;
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

        opportunities.push({
          itemId: purchase.itemId,
          itemName: purchase.itemName,
          category: purchase.category,
          tier: purchase.tier,
          quality: purchase.quality,
          purchaseCity: purchase.city,
          saleCity: sale.city,
          purchasePrice: purchase.sellPriceMin,
          salePrice: sale.buyPriceMax,
          ...profit,
          risk,
          opportunityScore,
          opportunityRecommendation: getOpportunityRecommendation(opportunityScore),
          purchaseUpdatedAt: purchase.sellPriceMinDate,
          saleUpdatedAt: sale.buyPriceMaxDate,
        });
      });
    });
  });

  opportunities.sort((first, second) => (
    sortBy === 'score'
      ? second.opportunityScore - first.opportunityScore || second.netProfit - first.netProfit
      : second.netProfit - first.netProfit
  ));
  return {
    data: opportunities.slice(0, limit),
    meta: { ...result.meta, opportunityCount: opportunities.length, marketTaxRate },
  };
};
