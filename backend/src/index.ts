import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
import projectsRouter from './routes/projects';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import { testDatabaseConnection, pool } from './db/client';
import { runMigrations } from './db/migrate';

const app = express();
const PORT = process.env.PORT || 3001;
const REQUIRED_ENV_VARS = ['OPENAI_API_KEY', 'DATABASE_URL'];

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

const server = app.listen(PORT, async () => {
  try {
    await runMigrations();
    await testDatabaseConnection();
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
