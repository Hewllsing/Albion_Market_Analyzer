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
  const materialBreakdown = materials.map((material) => {
    const quantityPerCraft = Number(material.quantity || 0);
    const requiredQuantity = quantityPerCraft * quantity;
    const effectiveQuantity = requiredQuantity * (1 - clampedReturnRate);
    const grossCost = Number(material.unitPrice || 0) * requiredQuantity;
    const effectiveCost = Number(material.unitPrice || 0) * effectiveQuantity;
    return {
      ...material,
      quantityPerCraft: round(quantityPerCraft, 4),
      requiredQuantity: round(requiredQuantity, 4),
      effectiveQuantity: round(effectiveQuantity, 4),
      grossCost: round(grossCost),
      effectiveCost: round(effectiveCost),
    };
  });
  const materialCostPerUnit = materialBreakdown.reduce((total, material) => total + material.effectiveCost, 0) / quantity;
  const stationFeePerUnit = materialCostPerUnit * stationFeeRate;
  const totalCostPerUnit = materialCostPerUnit + stationFeePerUnit;
  const grossProfitPerUnit = salePrice - totalCostPerUnit;
  const marketTaxPerUnit = salePrice * marketTaxRate;
  const netSaleRevenuePerUnit = salePrice - marketTaxPerUnit;
  const netProfitPerUnit = grossProfitPerUnit - marketTaxPerUnit;
  const marginPercent = totalCostPerUnit > 0 ? (netProfitPerUnit / totalCostPerUnit) * 100 : 0;

  return {
    materials: materialBreakdown,
    materialCost: round(materialCostPerUnit * quantity),
    materialGrossCost: round(materials.reduce(
      (total, material) => total + Number(material.unitPrice || 0) * Number(material.quantity || 0) * quantity,
      0,
    )),
    stationFee: round(stationFeePerUnit * quantity),
    totalCost: round(totalCostPerUnit * quantity),
    saleRevenue: round(salePrice * quantity),
    netSaleRevenue: round(netSaleRevenuePerUnit * quantity),
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
