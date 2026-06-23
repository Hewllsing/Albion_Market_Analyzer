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

export const findMarketHistory = async ({ itemId, city, server, category, tier, limit = 250 }) => {
  const database = getPool();
  if (!database) return [];

  const filters = [];
  const values = [];
  if (itemId) {
    filters.push('mp.item_id = ?');
    values.push(itemId);
  }
  if (city) {
    filters.push('mp.city = ?');
    values.push(city);
  }
  if (server) {
    filters.push('mp.server = ?');
    values.push(server);
  }
  if (category) {
    filters.push('i.category = ?');
    values.push(category);
  }
  if (tier) {
    filters.push('i.tier = ?');
    values.push(Number(tier));
  }
  values.push(limit);

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const [rows] = await database.query(
    `SELECT mp.id, mp.item_id AS itemId, i.name AS itemName, i.category, i.tier,
            mp.city, mp.quality,
            mp.sell_price_min AS sellPriceMin, mp.sell_price_min_date AS sellPriceMinDate,
            mp.sell_price_max AS sellPriceMax, mp.buy_price_max AS buyPriceMax,
            mp.buy_price_max_date AS buyPriceMaxDate, mp.server, mp.created_at AS createdAt
     FROM market_prices mp
     INNER JOIN items i ON i.item_id = mp.item_id
     ${where}
     ORDER BY mp.created_at DESC LIMIT ?`,
    values,
  );
  return rows;
};
