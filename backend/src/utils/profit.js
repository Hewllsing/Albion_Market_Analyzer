const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

export const calculateArbitrage = ({ purchasePrice, salePrice, marketTaxRate }) => {
  const grossProfit = salePrice - purchasePrice;
  const estimatedTax = salePrice * marketTaxRate;
  const netProfit = grossProfit - estimatedTax;
  const marginPercent = purchasePrice > 0 ? (netProfit / purchasePrice) * 100 : 0;

  return {
    grossProfit: round(grossProfit),
    estimatedTax: round(estimatedTax),
    netProfit: round(netProfit),
    marginPercent: round(marginPercent),
  };
};

export const calculateCraftingProfit = ({
  materials,
  quantity = 1,
  salePrice,
  marketTaxRate,
  stationFeeRate,
  resourceReturnRate,
}) => {
  const clampedReturnRate = Math.min(0.95, Math.max(0, resourceReturnRate));
  const materialCostPerUnit = materials.reduce(
    (total, material) => total + material.unitPrice * material.quantity * (1 - clampedReturnRate),
    0,
  );
  const stationFeePerUnit = materialCostPerUnit * stationFeeRate;
  const totalCostPerUnit = materialCostPerUnit + stationFeePerUnit;
  const grossProfitPerUnit = salePrice - totalCostPerUnit;
  const marketTaxPerUnit = salePrice * marketTaxRate;
  const netProfitPerUnit = grossProfitPerUnit - marketTaxPerUnit;
  const marginPercent = totalCostPerUnit > 0 ? (netProfitPerUnit / totalCostPerUnit) * 100 : 0;

  return {
    materialCost: round(materialCostPerUnit * quantity),
    stationFee: round(stationFeePerUnit * quantity),
    totalCost: round(totalCostPerUnit * quantity),
    saleRevenue: round(salePrice * quantity),
    grossProfit: round(grossProfitPerUnit * quantity),
    marketTax: round(marketTaxPerUnit * quantity),
    netProfit: round(netProfitPerUnit * quantity),
    marginPercent: round(marginPercent),
    profitPerUnit: round(netProfitPerUnit),
    profitPer100: round(netProfitPerUnit * 100),
  };
};

export const getRecommendation = (marginPercent, netProfit) => {
  if (marginPercent >= 15 && netProfit > 0) return 'Craftar';
  if (marginPercent >= 5 && netProfit > 0) return 'Aguardar';
  return 'Nao vale a pena';
};
