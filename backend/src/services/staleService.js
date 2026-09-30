import { pool } from '../config/db.js';
import { redis } from '../config/redis.js';

const KEY = 'stale-leads';

const STALE_SQL = `
  SELECT id, user_id, name,
         COALESCE(last_contacted_at, created_at) AS last_contacted_at,
         GREATEST(0, FLOOR(EXTRACT(EPOCH FROM
           NOW() - COALESCE(last_contacted_at, created_at)
         ) / 86400))::int AS inactive_days
  FROM leads
  WHERE status NOT IN ('Converted', 'Lost')
    AND COALESCE(last_contacted_at, created_at) < NOW() - INTERVAL '7 days'
`;

export async function scanStale() {
  const { rows } = await pool.query(
    `${STALE_SQL} ORDER BY last_contacted_at ASC`
  );

  const users = {};

  for (const lead of rows) {
    (users[lead.user_id] ||= []).push(lead);
  }

  const pipeline = redis.multi().del(KEY);

  for (const [userId, leads] of Object.entries(users)) {
    pipeline.hset(KEY, userId, JSON.stringify(leads));
  }

  await pipeline.exec();
}

export async function getStaleLeads(userId) {
  const cached = await redis.hget(KEY, userId);

  if (cached) {
    return JSON.parse(cached).slice(0, 10);
  }

  const { rows } = await pool.query(
    `${STALE_SQL}
     AND user_id = $1
     ORDER BY last_contacted_at ASC
     LIMIT 10`,
    [userId]
  );

  return rows;
}