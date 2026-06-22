import { env } from '../config/env.js';
import { calculateArbitrage } from '../utils/profit.js';
import { fetchMarketPrices } from './marketService.js';

const hoursSince = (dateValue) => {
  if (!dateValue) return Infinity;
  return Math.max(0, (Date.now() - new Date(dateValue).getTime()) / 3_600_000);
};

const estimateRisk = (purchase, sale) => {
  const staleness = Math.max(
    hoursSince(purchase.sellPriceMinDate),
    hoursSince(sale.buyPriceMaxDate),
  );
  if (staleness > 8) return { level: 'Alto', score: 3, reason: 'Preco com mais de 8h' };
  if (staleness > 3) return { level: 'Medio', score: 2, reason: 'Preco com mais de 3h' };
  return { level: 'Baixo', score: 1, reason: 'Precos recentes' };
};

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
          risk: estimateRisk(purchase, sale),
          purchaseUpdatedAt: purchase.sellPriceMinDate,
          saleUpdatedAt: sale.buyPriceMaxDate,
        });
      });
    });
  });

  opportunities.sort((first, second) => second.netProfit - first.netProfit);
  return {
    data: opportunities.slice(0, limit),
    meta: { ...result.meta, opportunityCount: opportunities.length, marketTaxRate },
  };
};
