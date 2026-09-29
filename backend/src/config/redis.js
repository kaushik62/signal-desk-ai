import Redis from 'ioredis';
import { env } from './env.js';

// maxRetriesPerRequest must be null for BullMQ (used in Step 6).
export const redis = new Redis({
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 200, 3000),
});

// With Redis down, ioredis queues commands forever. Use this for any call made during a web request.
export const withTimeout = (promise, ms = 2000) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timed out')), ms))]);

redis.on('error', (err) => console.error('Redis error:', err.message));
