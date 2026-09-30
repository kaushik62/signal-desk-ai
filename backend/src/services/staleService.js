import { pool } from '../config/db.js';
import { redis } from '../config/redis.js';

const CACHE_TTL = 300;

// Get stale leads for a specific user
export async function getStaleLeads(userId) {
  const cacheKey = `stale-leads:${userId}`;

  const cached = await redis.get(cacheKey);

  if (cached !== null) {
    return JSON.parse(cached);
  }

  // 2. Fetch stale leads from PostgreSQL
  const result = await pool.query(
    `
      SELECT
        id,
        user_id,
        name,
        COALESCE(last_contacted_at, created_at) AS last_contacted_at,
        GREATEST(
          0,
          FLOOR(
            EXTRACT(
              EPOCH FROM (
                NOW() - COALESCE(last_contacted_at, created_at)
              )
            ) / 86400
          )
        )::int AS inactive_days
      FROM leads
      WHERE user_id = $1
        AND status NOT IN ('Converted', 'Lost')
        AND COALESCE(last_contacted_at, created_at)
            < NOW() - INTERVAL '7 days'
      ORDER BY COALESCE(last_contacted_at, created_at) ASC
      LIMIT 10
    `,
    [userId]
  );

  await redis.set(
    cacheKey,
    JSON.stringify(result.rows),
    'EX',
    CACHE_TTL
  );

  return result.rows;
}

// Clear cache 
export async function clearStaleCache(userId) {
  const cacheKey = `stale-leads:${userId}`;

  await redis.del(cacheKey);
}