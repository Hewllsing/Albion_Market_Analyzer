import assert from 'node:assert/strict';
import test from 'node:test';
import { filterMarketPrices } from '../src/services/marketService.js';
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
  assert.equal(result.stationFee, 160);
  assert.equal(result.netProfit, 520);
  assert.equal(result.profitPerUnit, 260);
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
