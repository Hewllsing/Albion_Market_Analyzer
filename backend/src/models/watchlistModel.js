import { getPool } from '../database/connection.js';
import { AppError } from '../utils/AppError.js';

const requireDatabase = () => {
  const database = getPool();
  if (!database) {
    throw new AppError('Configure o MySQL/MariaDB para usar a watchlist.', 503);
  }
  return database;
};

export const listWatchlist = async () => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT id, item_id AS itemId, target_profit_percent AS targetProfitPercent,
            target_net_profit AS targetNetProfit, created_at AS createdAt
     FROM user_watchlist ORDER BY created_at DESC`,
  );
  return rows;
};

export const addWatchlistItem = async ({ itemId, targetProfitPercent, targetNetProfit }) => {
  const database = requireDatabase();
  await database.query(
    `INSERT INTO user_watchlist (item_id, target_profit_percent, target_net_profit)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       target_profit_percent = VALUES(target_profit_percent),
       target_net_profit = VALUES(target_net_profit)`,
    [itemId, targetProfitPercent, targetNetProfit],
  );
  const [rows] = await database.query(
    `SELECT id, item_id AS itemId, target_profit_percent AS targetProfitPercent,
            target_net_profit AS targetNetProfit, created_at AS createdAt
     FROM user_watchlist WHERE item_id = ?`,
    [itemId],
  );
  return rows[0];
};

export const deleteWatchlistItem = async (id) => {
  const database = requireDatabase();
  const [result] = await database.query('DELETE FROM user_watchlist WHERE id = ?', [id]);
  return result.affectedRows > 0;
};
