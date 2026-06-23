import { env } from '../config/env.js';
import { getPool } from '../database/connection.js';
import { AppError } from '../utils/AppError.js';
import { hashResetToken } from '../utils/auth.js';

const requireDatabase = () => {
  const database = getPool();
  if (!database) throw new AppError('Configure o MySQL/MariaDB para usar usuarios.', 503);
  return database;
};

const mapUser = (row) => row && ({
  id: row.id,
  name: row.name,
  email: row.email,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const findUserByEmail = async (email) => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT id, name, email, password_hash AS passwordHash, password_salt AS passwordSalt,
            created_at AS createdAt, updated_at AS updatedAt
     FROM users WHERE email = ?`,
    [email],
  );
  return rows[0] || null;
};

export const findUserById = async (id) => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT id, name, email, created_at AS createdAt, updated_at AS updatedAt
     FROM users WHERE id = ?`,
    [id],
  );
  return mapUser(rows[0]);
};

export const createUser = async ({ name, email, passwordHash, passwordSalt }) => {
  const database = requireDatabase();
  const [result] = await database.query(
    `INSERT INTO users (name, email, password_hash, password_salt)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, passwordSalt],
  );
  await ensureUserSettings(result.insertId);
  return findUserById(result.insertId);
};

export const updateUserProfile = async (userId, { name, email }) => {
  const database = requireDatabase();
  await database.query(
    `UPDATE users SET name = ?, email = ? WHERE id = ?`,
    [name, email, userId],
  );
  return findUserById(userId);
};

export const updateUserPassword = async (userId, { passwordHash, passwordSalt }) => {
  const database = requireDatabase();
  await database.query(
    `UPDATE users SET password_hash = ?, password_salt = ? WHERE id = ?`,
    [passwordHash, passwordSalt, userId],
  );
};

export const ensureUserSettings = async (userId) => {
  const database = requireDatabase();
  await database.query(
    `INSERT IGNORE INTO user_settings (user_id, market_tax_rate)
     VALUES (?, ?)`,
    [userId, env.defaultMarketTax],
  );
};

export const getUserSettings = async (userId) => {
  const database = requireDatabase();
  await ensureUserSettings(userId);
  const [rows] = await database.query(
    `SELECT primary_server AS primaryServer, primary_city AS primaryCity,
            language, currency_server AS currencyServer,
            market_tax_rate AS marketTaxRate, focus_return_rate AS focusReturnRate,
            player_type AS playerType, premium_goal_silver AS premiumGoalSilver,
            daily_profit_goal AS dailyProfitGoal, updated_at AS updatedAt
     FROM user_settings WHERE user_id = ?`,
    [userId],
  );
  return rows[0];
};

export const updateUserSettings = async (userId, settings) => {
  const database = requireDatabase();
  await ensureUserSettings(userId);
  await database.query(
    `UPDATE user_settings
     SET primary_server = ?, primary_city = ?, language = ?, currency_server = ?,
         market_tax_rate = ?, focus_return_rate = ?, player_type = ?,
         premium_goal_silver = ?, daily_profit_goal = ?
     WHERE user_id = ?`,
    [
      settings.primaryServer,
      settings.primaryCity,
      settings.language,
      settings.currencyServer,
      settings.marketTaxRate,
      settings.focusReturnRate,
      settings.playerType,
      settings.premiumGoalSilver,
      settings.dailyProfitGoal,
      userId,
    ],
  );
  return getUserSettings(userId);
};

export const createPasswordReset = async ({ userId, token, expiresAt }) => {
  const database = requireDatabase();
  const tokenHash = hashResetToken(token);
  await database.query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES (?, ?, ?)`,
    [userId, tokenHash, expiresAt],
  );
};

export const consumePasswordReset = async (token) => {
  const database = requireDatabase();
  const tokenHash = hashResetToken(token);
  const [rows] = await database.query(
    `SELECT id, user_id AS userId
     FROM password_reset_tokens
     WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [tokenHash],
  );
  const row = rows[0];
  if (!row) return null;
  await database.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?', [row.id]);
  return row;
};

export const listFavorites = async (userId) => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT uf.id, uf.item_id AS itemId, i.name AS itemName, i.category, i.tier,
            uf.created_at AS createdAt
     FROM user_favorites uf
     INNER JOIN items i ON i.item_id = uf.item_id
     WHERE uf.user_id = ?
     ORDER BY uf.created_at DESC`,
    [userId],
  );
  return rows;
};

export const addFavorite = async ({ userId, itemId }) => {
  const database = requireDatabase();
  await database.query(
    `INSERT INTO user_favorites (user_id, item_id)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE item_id = VALUES(item_id)`,
    [userId, itemId],
  );
  return listFavorites(userId);
};

export const deleteFavorite = async ({ userId, id }) => {
  const database = requireDatabase();
  const [result] = await database.query(
    'DELETE FROM user_favorites WHERE user_id = ? AND id = ?',
    [userId, id],
  );
  return result.affectedRows > 0;
};

export const listSavedOpportunities = async (userId) => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT id, opportunity_type AS opportunityType, item_id AS itemId, title,
            payload, target_net_profit AS targetNetProfit,
            target_margin_percent AS targetMarginPercent, created_at AS createdAt
     FROM saved_opportunities
     WHERE user_id = ?
     ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map((row) => ({
    ...row,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
  }));
};

export const addSavedOpportunity = async ({
  userId,
  opportunityType,
  itemId,
  title,
  payload,
  targetNetProfit = 0,
  targetMarginPercent = 0,
}) => {
  const database = requireDatabase();
  await database.query(
    `INSERT INTO saved_opportunities
       (user_id, opportunity_type, item_id, title, payload, target_net_profit, target_margin_percent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [userId, opportunityType, itemId || null, title, JSON.stringify(payload || {}), targetNetProfit, targetMarginPercent],
  );
  return listSavedOpportunities(userId);
};

export const deleteSavedOpportunity = async ({ userId, id }) => {
  const database = requireDatabase();
  const [result] = await database.query(
    'DELETE FROM saved_opportunities WHERE user_id = ? AND id = ?',
    [userId, id],
  );
  return result.affectedRows > 0;
};

export const listAnalysisHistory = async (userId, limit = 20) => {
  const database = requireDatabase();
  const [rows] = await database.query(
    `SELECT id, analysis_type AS analysisType, summary, payload, created_at AS createdAt
     FROM analysis_history
     WHERE user_id = ?
     ORDER BY created_at DESC LIMIT ?`,
    [userId, limit],
  );
  return rows.map((row) => ({
    ...row,
    payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload,
  }));
};

export const addAnalysisHistory = async ({ userId, analysisType, summary, payload }) => {
  const database = requireDatabase();
  await database.query(
    `INSERT INTO analysis_history (user_id, analysis_type, summary, payload)
     VALUES (?, ?, ?, ?)`,
    [userId, analysisType, summary, JSON.stringify(payload || {})],
  );
  return listAnalysisHistory(userId, 10);
};

export const getUserDashboard = async (userId) => {
  const database = requireDatabase();
  const [[watchlistCountRows], [favoritesRows], [savedRows], [historyRows]] = await Promise.all([
    database.query('SELECT COUNT(*) AS total FROM user_watchlist WHERE user_id = ?', [userId]),
    database.query('SELECT COUNT(*) AS total FROM user_favorites WHERE user_id = ?', [userId]),
    database.query('SELECT COUNT(*) AS total FROM saved_opportunities WHERE user_id = ?', [userId]),
    database.query('SELECT COUNT(*) AS total FROM analysis_history WHERE user_id = ?', [userId]),
  ]);

  return {
    settings: await getUserSettings(userId),
    watchlistCount: watchlistCountRows[0].total,
    favoritesCount: favoritesRows[0].total,
    savedOpportunitiesCount: savedRows[0].total,
    analysisHistoryCount: historyRows[0].total,
    favorites: await listFavorites(userId),
    savedOpportunities: await listSavedOpportunities(userId),
    analysisHistory: await listAnalysisHistory(userId, 10),
  };
};
