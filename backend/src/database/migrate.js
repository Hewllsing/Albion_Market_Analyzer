import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../config/env.js';

if (!env.database.host || !env.database.user || !env.database.name) {
  throw new Error('Defina DB_HOST, DB_USER e DB_NAME antes de executar a migration.');
}

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const connection = await mysql.createConnection({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  multipleStatements: true,
});

try {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name VARCHAR(190) NOT NULL,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  const migrationsDirectory = path.join(currentDirectory, 'migrations');
  const files = (await readdir(migrationsDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const [existing] = await connection.query('SELECT name FROM schema_migrations WHERE name = ?', [file]);
    if (existing.length) {
      console.log(`Migration ${file} ja aplicada.`);
      continue;
    }

    const migration = await readFile(path.join(migrationsDirectory, file), 'utf8');
    await connection.beginTransaction();
    try {
      await connection.query(migration);
      await connection.query('INSERT INTO schema_migrations (name) VALUES (?)', [file]);
      await connection.commit();
      console.log(`Migration ${file} aplicada.`);
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }
} finally {
  await connection.end();
}
