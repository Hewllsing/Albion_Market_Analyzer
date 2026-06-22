import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  marketCacheTtlMs: toNumber(process.env.MARKET_CACHE_TTL_MS, 120000),
  marketRequestTimeoutMs: toNumber(process.env.MARKET_REQUEST_TIMEOUT_MS, 15000),
  defaultMarketTax: toNumber(process.env.DEFAULT_MARKET_TAX, 0.065),
  database: {
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT, 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME,
    connectionLimit: toNumber(process.env.DB_CONNECTION_LIMIT, 10),
  },
};
