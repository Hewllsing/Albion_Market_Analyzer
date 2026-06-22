import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

if (!env.database.host || !env.database.user || !env.database.name) {
  throw new Error('Defina DB_HOST, DB_USER e DB_NAME antes de executar a migration.');
}

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const migration = await readFile(path.join(currentDirectory, 'migrations', '001_initial_schema.sql'), 'utf8');
const connection = await mysql.createConnection({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  multipleStatements: true,
});

try {
  await connection.query(migration);
  console.log('Migration 001_initial_schema aplicada.');
} finally {
  await connection.end();
}
