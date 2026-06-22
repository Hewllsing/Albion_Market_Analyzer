import { getPool } from '../database/connection.js';

export const saveMarketPrices = async (prices) => {
  const database = getPool();
  if (!database || prices.length === 0) return 0;

  const values = prices.map((price) => [
    price.itemId,
    price.city,
    price.quality,
    price.sellPriceMin,
    price.sellPriceMinDate ? new Date(price.sellPriceMinDate) : null,
    price.sellPriceMax,
    price.buyPriceMax,
    price.buyPriceMaxDate ? new Date(price.buyPriceMaxDate) : null,
    price.server,
  ]);

  await database.query(
    `INSERT INTO market_prices
      (item_id, city, quality, sell_price_min, sell_price_min_date, sell_price_max,
       buy_price_max, buy_price_max_date, server)
     VALUES ?`,
    [values],
  );
  return values.length;
};

export const findMarketHistory = async ({ itemId, city, server, limit = 250 }) => {
  const database = getPool();
  if (!database) return [];

  const filters = [];
  const values = [];
  if (itemId) {
    filters.push('item_id = ?');
    values.push(itemId);
  }
  if (city) {
    filters.push('city = ?');
    values.push(city);
  }
  if (server) {
    filters.push('server = ?');
    values.push(server);
  }
  values.push(limit);

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await database.query(
    `SELECT id, item_id AS itemId, city, quality,
            sell_price_min AS sellPriceMin, sell_price_min_date AS sellPriceMinDate,
            sell_price_max AS sellPriceMax, buy_price_max AS buyPriceMax,
            buy_price_max_date AS buyPriceMaxDate, server, created_at AS createdAt
     FROM market_prices ${where}
     ORDER BY created_at DESC LIMIT ?`,
    values,
  );
  return rows;
};
