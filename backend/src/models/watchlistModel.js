import { getPool } from '../database/connection.js';
import { AppError } from '../utils/AppError.js';

const requireDatabase = () => {
  const database = getPool();
  if (!database) {
    throw new AppError('Configure o MySQL/MariaDB para usar a watchlist.', 503);
  }
  return database;
};

export const listWatchlist = async (userId) => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT id, item_id AS itemId, target_profit_percent AS targetProfitPercent,
            target_net_profit AS targetNetProfit, created_at AS createdAt
     FROM user_watchlist
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows;
};

export const addWatchlistItem = async ({ userId, itemId, targetProfitPercent, targetNetProfit }) => {
  const database = requireDatabase();
  await database.query(
    `INSERT INTO user_watchlist (user_id, item_id, target_profit_percent, target_net_profit)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       target_profit_percent = VALUES(target_profit_percent),
       target_net_profit = VALUES(target_net_profit)`,
    [userId, itemId, targetProfitPercent, targetNetProfit],
  );
  const [rows] = await database.query(
    `SELECT id, item_id AS itemId, target_profit_percent AS targetProfitPercent,
            target_net_profit AS targetNetProfit, created_at AS createdAt
     FROM user_watchlist WHERE user_id = ? AND item_id = ?`,
    [userId, itemId],
  );
  return rows[0];
};

export const deleteWatchlistItem = async ({ userId, id }) => {
  const database = requireDatabase();
  const [result] = await database.query('DELETE FROM user_watchlist WHERE user_id = ? AND id = ?', [userId, id]);
  return result.affectedRows > 0;
};
