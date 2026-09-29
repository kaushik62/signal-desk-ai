import { pool } from '../config/db.js';
import { redis, withTimeout } from '../config/redis.js';

const KEY = 'stale-leads';
const STALE_SQL = `
  SELECT id, user_id, name, COALESCE(last_contacted_at, created_at) AS last_contacted_at,
         GREATEST(0, floor(extract(epoch FROM now() - COALESCE(last_contacted_at, created_at)) / 86400))::int AS inactive_days
  FROM leads
  WHERE status NOT IN ('Converted','Lost') AND COALESCE(last_contacted_at, created_at) < now() - interval '7 days'`;

// Overwrites the whole hash each run, so repeated runs never create duplicate alerts.
export async function scanStale() {
  const { rows } = await pool.query(`${STALE_SQL} ORDER BY last_contacted_at ASC`);
  const byUser = {};
  for (const r of rows) (byUser[r.user_id] ||= []).push(r);
  const multi = redis.multi().del(KEY);
  for (const [userId, list] of Object.entries(byUser)) multi.hset(KEY, userId, JSON.stringify(list));
  await multi.exec();
}

export async function getStaleLeads(userId) {
  try {
    if (await withTimeout(redis.exists(KEY))) {
      return JSON.parse((await withTimeout(redis.hget(KEY, userId))) || '[]').slice(0, 10);
    }
  } catch (e) {
    console.error('Stale cache unavailable:', e.message);
  }
  const { rows } = await pool.query(`${STALE_SQL} AND user_id=$1 ORDER BY last_contacted_at ASC LIMIT 10`, [userId]);
  return rows;
}
