import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..', '..', '..');
const backendRoot = path.resolve(currentDirectory, '..', '..');

dotenv.config({ path: path.join(projectRoot, '.env'), quiet: true });
dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true, override: true });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readEnv = (...names) => names.map((name) => process.env[name]).find((value) => value !== undefined && value !== '');

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toNumber(process.env.PORT, 3000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  marketCacheTtlMs: toNumber(process.env.MARKET_CACHE_TTL_MS, 120000),
  marketRequestTimeoutMs: toNumber(process.env.MARKET_REQUEST_TIMEOUT_MS, 15000),
  defaultMarketTax: toNumber(process.env.DEFAULT_MARKET_TAX, 0.065),
  database: {
    host: readEnv('DB_HOST', 'DB_HOST_MYSQL'),
    port: toNumber(readEnv('DB_PORT', 'DB_PORT_MYSQL'), 3306),
    user: readEnv('DB_USER', 'DB_USER_MYSQL'),
    password: readEnv('DB_PASSWORD', 'DB_PASSWORD_MYSQL') || '',
    name: readEnv('DB_NAME', 'DB_NAME_MYSQL'),
    connectionLimit: toNumber(readEnv('DB_CONNECTION_LIMIT', 'DB_CONNECTION_LIMIT_MYSQL'), 10),
  },
};
