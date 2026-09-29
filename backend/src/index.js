import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { pool, initDb } from './config/db.js';
import { redis } from './config/redis.js';
import { requireAuth } from './middleware/auth.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import leadRoutes from './routes/leads.js';
import followUpRoutes from './routes/followUps.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import { startWorkers } from './workers/index.js';

if (!env.jwtSecret) {
  console.error('JWT_SECRET is not set. Add it to your .env file.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/leads', requireAuth, leadRoutes);
app.use('/api/follow-ups', requireAuth, followUpRoutes);
app.use('/api/ai', requireAuth, aiRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

const server = app.listen(env.port, () => console.log(`API listening on port ${env.port}`));

const workersReady = initDb()
  .then(() => startWorkers())
  .catch((e) => {
    console.error('Initialization failed:', e.message);
    return [];
  });

const shutdown = async () => {
  server.close();
  await Promise.allSettled((await workersReady).map((w) => w.close()));
  await Promise.allSettled([pool.end(), redis.quit()]);
  process.exit(0);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
