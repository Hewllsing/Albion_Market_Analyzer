import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

let pool;

export const isDatabaseConfigured = () => Boolean(
  env.database.host && env.database.user && env.database.name,
);

export const getPool = () => {
  if (!isDatabaseConfigured()) return null;
  if (!pool) {
    pool = mysql.createPool({
      host: env.database.host,
      port: env.database.port,
      user: env.database.user,
      password: env.database.password,
      database: env.database.name,
      connectionLimit: env.database.connectionLimit,
      waitForConnections: true,
      queueLimit: 0,
      decimalNumbers: true,
    });
  }
  return pool;
};

export const checkDatabaseConnection = async () => {
  const database = getPool();
  if (!database) return { configured: false, connected: false };
  try {
    await database.query('SELECT 1');
    return { configured: true, connected: true };
  } catch (error) {
    return { configured: true, connected: false, error: error.message };
  }
};
