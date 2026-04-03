import { Pool, QueryResult, QueryResultRow } from 'pg';

let poolInstance: Pool | null = null;

function getPool(): Pool {
  if (poolInstance) return poolInstance;
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('Missing required environment variable: DATABASE_URL');
  }
  const sslEnabled = process.env.DATABASE_SSL === 'true';
  poolInstance = new Pool({
    connectionString: databaseUrl,
    ssl: sslEnabled ? { rejectUnauthorized: false } : undefined,
  });
  return poolInstance;
}

export const pool = {
  query: <T extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]) =>
    getPool().query<T>(text, params),
  connect: () => getPool().connect(),
  end: () => (poolInstance ? poolInstance.end() : Promise.resolve()),
};

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

export async function testDatabaseConnection(): Promise<void> {
  await query('SELECT 1');
}
