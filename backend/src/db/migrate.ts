import fs from 'fs/promises';
import path from 'path';
import { PoolClient } from 'pg';
import { pool } from './client';

interface MigrationFile {
  name: string;
  sql: string;
}

async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

async function resolveMigrationsDir(): Promise<string> {
  const configuredDir = process.env.DB_MIGRATIONS_DIR?.trim();
  const candidateDirs = [
    configuredDir ? path.resolve(configuredDir) : '',
    path.resolve(__dirname, 'migrations'),
    path.resolve(__dirname, '..', '..', 'src', 'db', 'migrations'),
    path.resolve(process.cwd(), 'src', 'db', 'migrations'),
    path.resolve(process.cwd(), 'dist', 'db', 'migrations'),
    path.resolve(process.cwd(), 'backend', 'src', 'db', 'migrations'),
  ].filter(Boolean);

  for (const dir of candidateDirs) {
    if (await directoryExists(dir)) {
      return dir;
    }
  }

  throw new Error(
    `No migration directory found. Checked: ${candidateDirs.join(', ')}`
  );
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
  const migrationsDir = await resolveMigrationsDir();
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No .sql migration files found in ${migrationsDir}`);
  }

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
