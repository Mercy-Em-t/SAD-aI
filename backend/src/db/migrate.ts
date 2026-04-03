import fs from 'fs/promises';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from './client';
const migrationsDir = path.resolve(__dirname, 'migrations');

interface MigrationFile {
  name: string;
  sql: string;
}

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);
}

async function listMigrationFiles(): Promise<MigrationFile[]> {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const loaded: MigrationFile[] = [];
  for (const fileName of files) {
    const fullPath = path.join(migrationsDir, fileName);
    const sql = await fs.readFile(fullPath, 'utf-8');
    loaded.push({ name: fileName, sql });
  }
  return loaded;
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureMigrationsTable(client);
    const migrations = await listMigrationFiles();
    for (const migration of migrations) {
      const exists = await client.query<{ version: string }>(
        'SELECT version FROM schema_migrations WHERE version = $1 LIMIT 1',
        [migration.name]
      );
      if (!exists.rowCount || exists.rowCount === 0) {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO schema_migrations (version) VALUES ($1)',
          [migration.name]
        );
      }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
