import 'dotenv/config';
import { env } from './config/env.js';
import app from "./app.js";
import { pool, initDb } from './config/db.js';
import { redis } from './config/redis.js';
import { startWorkers } from './workers/index.js';
import { closeQueues } from './services/queue.js';
import { closeEmailConnection } from './services/emailService.js';

const PORT = env.port;

// Check required environment variables
if (!env.jwtSecret) {
  console.error('JWT_SECRET is missing from .env');
  process.exit(1);
}

async function startServer() {
  try {
    // Initialize database
    await initDb();
    console.log('Database initialized');

    // Start background workers
    const workers = await startWorkers();

    // Start Express server
    const server = app.listen(PORT, () => {
      console.log(`API listening on port ${PORT}`);
    });

    // Graceful shutdown
    let isShuttingDown = false;

    async function shutdown() {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log('Shutting down server...');

      server.close();

      await Promise.allSettled(
        workers.map((worker) => worker.close())
      );

      await closeQueues().catch((err) => {
        console.error('Error closing queues:', err.message);
      });

      closeEmailConnection();

      await Promise.allSettled([
        pool.end(),
        redis.quit(),
      ]);

      process.exit(0);
    }

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error.message);

    await Promise.allSettled([
      pool.end(),
      redis.quit(),
    ]);

    process.exit(1);
  }
}


startServer();