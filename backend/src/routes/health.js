import { Router } from 'express';
import { pool } from '../config/db.js';
import { redis, withTimeout } from '../config/redis.js';

const router = Router();
const status = (promise) => promise.then(() => 'up', () => 'down');

router.get('/', async (req, res) => {
  const [postgres, redisStatus] = await Promise.all([
    status(pool.query('SELECT 1')),
    status(withTimeout(redis.ping())),
  ]);
  const healthy = postgres === 'up' && redisStatus === 'up';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    services: { postgres, redis: redisStatus },
  });
});

export default router;
