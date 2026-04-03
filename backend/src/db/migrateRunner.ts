import dotenv from 'dotenv';

dotenv.config();

import { runMigrations } from './migrate';
import { pool } from './client';

async function main(): Promise<void> {
  try {
    await runMigrations();
    console.log('Migrations completed successfully.');
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error('Migration runner crashed:', error);
  await pool.end();
  process.exit(1);
});
