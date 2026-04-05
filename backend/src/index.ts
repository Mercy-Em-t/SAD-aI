import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import projectsRouter from './routes/projects';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import { testDatabaseConnection, pool } from './db/client';
import { runMigrations } from './db/migrate';

const app = express();
const PORT = process.env.PORT || 3001;
const REQUIRED_ENV_VARS = ['OPENAI_API_KEY', 'DATABASE_URL'];
const STARTUP_DB_RETRY_ATTEMPTS = Number(process.env.STARTUP_DB_RETRY_ATTEMPTS || 10);
const STARTUP_DB_RETRY_DELAY_MS = Number(process.env.STARTUP_DB_RETRY_DELAY_MS || 3000);

for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initializeDatabaseWithRetry(): Promise<void> {
  const attempts = Number.isFinite(STARTUP_DB_RETRY_ATTEMPTS) && STARTUP_DB_RETRY_ATTEMPTS > 0
    ? Math.floor(STARTUP_DB_RETRY_ATTEMPTS)
    : 1;
  const delayMs = Number.isFinite(STARTUP_DB_RETRY_DELAY_MS) && STARTUP_DB_RETRY_DELAY_MS > 0
    ? Math.floor(STARTUP_DB_RETRY_DELAY_MS)
    : 3000;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await testDatabaseConnection();
      await runMigrations();
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      console.warn(
        `Database startup attempt ${attempt}/${attempts} failed. Retrying in ${delayMs}ms...`,
        error
      );
      await sleep(delayMs);
    }
  }
}

const server = app.listen(PORT, async () => {
  try {
    await initializeDatabaseWithRetry();
    console.log(`SAD-GENIUS API running on port ${PORT}`);
  } catch (error) {
    console.error('Database connection failed during startup:', error);
    process.exit(1);
  }
});

async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGTERM', () => {
  shutdown('SIGTERM').catch((error) => {
    console.error('Shutdown error:', error);
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  shutdown('SIGINT').catch((error) => {
    console.error('Shutdown error:', error);
    process.exit(1);
  });
});

export default app;
