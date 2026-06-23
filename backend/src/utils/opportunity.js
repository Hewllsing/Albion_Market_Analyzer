import { CITY_ROUTE_RISK, DEFAULT_CITIES } from '../config/market.js';

const round = (value, decimals = 0) => {
  const factor = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0));

export const hoursSince = (dateValue) => {
  if (!dateValue) return Infinity;
  const timestamp = new Date(dateValue).getTime();
  if (!Number.isFinite(timestamp)) return Infinity;
  return Math.max(0, (Date.now() - timestamp) / 3_600_000);
};

const maxStaleness = (dates) => {
  const values = dates.map(hoursSince);
  return values.length ? Math.max(...values) : Infinity;
};

const cityDistancePoints = (origin, destination) => {
  if (!origin || !destination || origin === destination) return 0;
  const originIndex = DEFAULT_CITIES.indexOf(origin);
  const destinationIndex = DEFAULT_CITIES.indexOf(destination);
  if (originIndex === -1 || destinationIndex === -1) return 2;
  const distance = Math.abs(originIndex - destinationIndex);
  if (distance >= 4) return 2;
  return 1;
};

export const estimateOpportunityRisk = ({
  purchaseCity,
  saleCity,
  updatedAtDates = [],
  hasImmediateSale = true,
  priceVariationPercent = 0,
  marginPercent = 0,
} = {}) => {
  const stalenessHours = maxStaleness(updatedAtDates);
  const freshnessPoints = stalenessHours > 8 ? 3 : stalenessHours > 3 ? 2 : stalenessHours > 1 ? 1 : 0;
  const routePoints = Math.max(CITY_ROUTE_RISK[purchaseCity] || 0, CITY_ROUTE_RISK[saleCity] || 0);
  const distancePoints = cityDistancePoints(purchaseCity, saleCity);
  const liquidityPoints = hasImmediateSale ? 0 : 2;
  const volatilityPoints = Math.abs(priceVariationPercent) > 35 ? 2 : Math.abs(priceVariationPercent) > 15 ? 1 : 0;
  const anomalyPoints = marginPercent > 60 ? 1 : 0;
  const points = freshnessPoints + routePoints + distancePoints + liquidityPoints + volatilityPoints + anomalyPoints;

  const level = points >= 7 ? 'Alto' : points >= 4 ? 'Medio' : 'Baixo';
  const reasons = [];
  if (freshnessPoints) reasons.push(stalenessHours > 8 ? 'preco antigo' : 'preco pouco recente');
  if (routePoints >= 3) reasons.push('rota perigosa');
  if (distancePoints >= 2) reasons.push('distancia alta');
  if (liquidityPoints) reasons.push('liquidez nao imediata');
  if (volatilityPoints) reasons.push('variacao recente');
  if (anomalyPoints) reasons.push('margem fora do normal');

  return {
    level,
    score: points,
    points,
    reason: reasons.length ? reasons.join(', ') : 'Sinal estavel',
    factors: {
      stalenessHours: Number.isFinite(stalenessHours) ? round(stalenessHours, 1) : null,
      freshnessPoints,
      routePoints,
      distancePoints,
      liquidityPoints,
      volatilityPoints,
      anomalyPoints,
    },
  };
};

export const calculateOpportunityScore = ({
  marginPercent = 0,
  risk,
  updatedAtDates = [],
  hasImmediateSale = true,
  netProfit = 0,
} = {}) => {
  const stalenessHours = maxStaleness(updatedAtDates);
  const marginComponent = clamp(marginPercent * 1.15, 0, 45);
  const liquidityComponent = hasImmediateSale ? 25 : 12;
  const freshnessComponent = stalenessHours <= 1 ? 25 : stalenessHours <= 3 ? 18 : stalenessHours <= 8 ? 10 : 2;
  const profitComponent = netProfit > 0 ? 5 : 0;
  const riskPenalty = (risk?.points ?? risk?.score ?? 0) * 5;

  return round(clamp(
    marginComponent + liquidityComponent + freshnessComponent + profitComponent - riskPenalty,
    0,
    100,
  ));
};

export const getOpportunityRecommendation = (score) => {
  if (score >= 80) return 'Forte oportunidade';
  if (score >= 65) return 'Boa oportunidade';
  if (score >= 45) return 'Monitorar';
  return 'Evitar';
};
