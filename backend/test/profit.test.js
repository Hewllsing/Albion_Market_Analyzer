import assert from 'node:assert/strict';
import test from 'node:test';
import { filterMarketPrices } from '../src/services/marketService.js';
import { getCraftingItemIdsByGroup } from '../src/services/craftingService.js';
import {
  calculateOpportunityScore,
  estimateOpportunityRisk,
  getOpportunityRecommendation,
} from '../src/utils/opportunity.js';
import { createToken, hashPassword, verifyPassword, verifyToken } from '../src/utils/auth.js';
import { calculateArbitrage, calculateCraftingProfit, getRecommendation } from '../src/utils/profit.js';

test('calcula lucro de arbitragem descontando taxa sobre a venda', () => {
  const result = calculateArbitrage({ purchasePrice: 1000, salePrice: 1500, marketTaxRate: 0.065 });
  assert.deepEqual(result, {
    grossProfit: 500,
    estimatedTax: 97.5,
    netProfit: 402.5,
    marginPercent: 40.25,
  });
});

test('calcula crafting com retorno, taxa de estacao e quantidade', () => {
  const result = calculateCraftingProfit({
    materials: [{ unitPrice: 100, quantity: 10 }],
    quantity: 2,
    salePrice: 1200,
    marketTaxRate: 0.05,
    stationFeeRate: 0.1,
    resourceReturnRate: 0.2,
  });
  assert.equal(result.materialCost, 1600);
  assert.equal(result.materialGrossCost, 2000);
  assert.equal(result.stationFee, 160);
  assert.equal(result.netSaleRevenue, 2280);
  assert.equal(result.netProfit, 520);
  assert.equal(result.profitPerUnit, 260);
  assert.equal(result.materials[0].requiredQuantity, 20);
  assert.equal(result.materials[0].effectiveQuantity, 16);
  assert.equal(result.materials[0].effectiveCost, 1600);
});

test('lista grupos exclusivos de crafting', () => {
  assert.ok(getCraftingItemIdsByGroup('food').includes('T4_MEAL_STEW'));
  assert.ok(getCraftingItemIdsByGroup('potions').includes('T4_POTION_HEAL'));
  assert.ok(getCraftingItemIdsByGroup('equipment').includes('T4_MAIN_SWORD'));
});

test('gera recomendacao por margem', () => {
  assert.equal(getRecommendation(20, 100), 'Craftar');
  assert.equal(getRecommendation(8, 100), 'Aguardar');
  assert.equal(getRecommendation(-2, -10), 'Nao vale a pena');
});

test('filtra cotacoes por preco minimo e margem minima', () => {
  const prices = [
    { itemId: 'A', sellPriceMin: 100, buyPriceMax: 130 },
    { itemId: 'B', sellPriceMin: 80, buyPriceMax: 150 },
    { itemId: 'C', sellPriceMin: 200, buyPriceMax: 210 },
  ];
  const result = filterMarketPrices(prices, { minimumPrice: 100, minimumMargin: 20 });
  assert.deepEqual(result.map((price) => price.itemId), ['A']);
});

test('classifica risco de oportunidade com rota perigosa e preco antigo', () => {
  const oldDate = new Date(Date.now() - 10 * 3_600_000).toISOString();
  const risk = estimateOpportunityRisk({
    purchaseCity: 'Martlock',
    saleCity: 'Black Market',
    updatedAtDates: [oldDate],
    hasImmediateSale: true,
    marginPercent: 20,
  });
  assert.equal(risk.level, 'Alto');
  assert.ok(risk.points >= 7);
});

test('calcula score e recomendacao de oportunidade', () => {
  const freshDate = new Date().toISOString();
  const risk = estimateOpportunityRisk({
    purchaseCity: 'Bridgewatch',
    saleCity: 'Martlock',
    updatedAtDates: [freshDate],
    hasImmediateSale: true,
    marginPercent: 30,
  });
  const score = calculateOpportunityScore({
    marginPercent: 30,
    risk,
    updatedAtDates: [freshDate],
    hasImmediateSale: true,
    netProfit: 5000,
  });
  assert.ok(score >= 65);
  assert.equal(getOpportunityRecommendation(82), 'Forte oportunidade');
  assert.equal(getOpportunityRecommendation(score), score >= 80 ? 'Forte oportunidade' : 'Boa oportunidade');
});

test('gera hash de senha e valida token de sessao', async () => {
  const password = 'senha-muito-segura';
  const hashed = await hashPassword(password);
  assert.equal(await verifyPassword({ password, salt: hashed.salt, hash: hashed.hash }), true);
  assert.equal(await verifyPassword({ password: 'errada', salt: hashed.salt, hash: hashed.hash }), false);

  const token = createToken({ id: 123, email: 'user@example.com', name: 'User' });
  const payload = verifyToken(token);
  assert.equal(payload.sub, '123');
  assert.equal(payload.email, 'user@example.com');
});
