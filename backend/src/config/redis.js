import Redis from 'ioredis';
import { env } from './env.js';

export const redisConfig = {
  host: env.redisHost,
  port: env.redisPort,
  maxRetriesPerRequest: null,
  retryStrategy: (times) => Math.min(times * 200, 3000),
  enableReadyCheck: false,
};

export const redis = new Redis(redisConfig);

export const withTimeout = (promise, ms = 3000) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis timed out')), ms)
    ),
  ]);

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});