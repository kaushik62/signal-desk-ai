import { pool } from '../config/db.js';
import { getStaleLeads } from './staleService.js';

export function clampDays(days) {
  days = Number(days);

  return [7, 30, 90].includes(days) ? days : 30;
}

async function getTimeline(userId, days) {
  const result = await pool.query(
    `WITH d AS (
       SELECT generate_series(
         CURRENT_DATE - ($2::int - 1),
         CURRENT_DATE,
         '1 day'::interval
       )::date AS day
     )
     SELECT
       d.day AS date,
       COUNT(l_created.id)::int AS created,
       COUNT(l_converted.id)::int AS converted
     FROM d
     LEFT JOIN leads l_created
       ON l_created.user_id = $1
       AND DATE(l_created.created_at) = d.day
     LEFT JOIN leads l_converted
       ON l_converted.user_id = $1
       AND l_converted.status = 'Converted'
       AND DATE(l_converted.updated_at) = d.day
     GROUP BY d.day
     ORDER BY d.day ASC`,
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
       AND created_at >= CURRENT_DATE - ($2::int - 1)`,
    [userId, days]
  );

  const total = result.rows[0].total;
  const converted = result.rows[0].converted;

  const conversionRate = total
    ? Math.round((converted / total) * 1000) / 10
    : 0;

  const [timeline, bySource, byStatus] = await Promise.all([
    getTimeline(userId, days),
    getDistribution('source', userId),
    getDistribution('status', userId),
  ]);

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

  const [summaryResult, followUpResult, byStatus, timeline, attentionResult, upcomingResult, stale] = await Promise.all([
    pool.query(
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
    ),

    pool.query(
      `SELECT COUNT(*)::int AS pending
       FROM follow_ups
       WHERE user_id = $1
         AND status = 'pending'`,
      [userId]
    ),

    getDistribution('status', userId),

    getTimeline(userId, days),

    pool.query(
      `SELECT id, name, company, score, status, last_contacted_at
       FROM leads
       WHERE user_id = $1
         AND status NOT IN ('Converted', 'Lost')
         AND score >= 40
         AND (last_contacted_at IS NULL OR last_contacted_at < NOW() - INTERVAL '3 days')
       ORDER BY score DESC, created_at ASC
       LIMIT 5`,
      [userId]
    ),

    pool.query(
      `SELECT f.id, f.lead_id, f.subject, f.scheduled_at, f.status, l.name AS lead_name
       FROM follow_ups f
       JOIN leads l ON l.id = f.lead_id
       WHERE f.user_id = $1
         AND f.status = 'pending'
       ORDER BY f.scheduled_at ASC
       LIMIT 5`,
      [userId]
    ),

    getStaleLeads(userId),
  ]);

  return {
    summary: {
      ...summaryResult.rows[0],
      pending: followUpResult.rows[0].pending,
    },
    byStatus,
    timeline,
    attention: attentionResult.rows,
    upcoming: upcomingResult.rows,
    stale,
  };
}