import { pool } from '../config/db.js';
import { getStaleLeads } from './staleService.js';

export function clampDays(days) {
  days = Number(days);

  return [7, 30, 90].includes(days) ? days : 30;
}

async function getTimeline(userId, days) {
  const result = await pool.query(
    `SELECT
       DATE(created_at) AS date,
       COUNT(*)::int AS created
     FROM leads
     WHERE user_id = $1
       AND created_at >= CURRENT_DATE - ($2 - 1)
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [userId, days]
  );

  return result.rows;
}

async function getDistribution(type, userId) {
  const column = type === 'source' ? 'source' : 'status';

  const result = await pool.query(
    `SELECT
       ${column} AS name,
       COUNT(*)::int AS value
     FROM leads
     WHERE user_id = $1
     GROUP BY ${column}
     ORDER BY value DESC`,
    [userId]
  );

  return result.rows;
}

export async function getAnalytics(userId, days) {
  days = clampDays(days);

  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (
         WHERE status = 'Converted'
       )::int AS converted
     FROM leads
     WHERE user_id = $1
       AND created_at >= CURRENT_DATE - ($2 - 1)`,
    [userId, days]
  );

  const total = result.rows[0].total;
  const converted = result.rows[0].converted;

  const conversionRate = total
    ? Math.round((converted / total) * 1000) / 10
    : 0;

  const timeline = await getTimeline(userId, days);
  const bySource = await getDistribution('source', userId);
  const byStatus = await getDistribution('status', userId);

  return {
    total,
    converted,
    conversionRate,
    timeline,
    bySource,
    byStatus,
  };
}

export async function getDashboard(userId, days) {
  days = clampDays(days);

  const result = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (
         WHERE score >= 70
           AND status NOT IN ('Converted', 'Lost')
       )::int AS hot,
       COUNT(*) FILTER (
         WHERE status = 'Converted'
       )::int AS converted,
       COUNT(*) FILTER (
         WHERE created_at >= NOW() - INTERVAL '7 days'
       )::int AS new_this_week
     FROM leads
     WHERE user_id = $1`,
    [userId]
  );

  const followUpResult = await pool.query(
    `SELECT COUNT(*)::int AS pending
     FROM follow_ups
     WHERE user_id = $1
       AND status = 'pending'`,
    [userId]
  );

  const byStatus = await getDistribution('status', userId);
  const timeline = await getTimeline(userId, days);
  const stale = await getStaleLeads(userId);

  return {
    summary: {
      ...result.rows[0],
      pending: followUpResult.rows[0].pending,
    },
    byStatus,
    timeline,
    stale,
  };
}