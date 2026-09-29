import { pool } from '../config/db.js';
import { getStaleLeads } from './staleService.js';

export const clampDays = (v) => [7, 30, 90].includes(Number(v)) ? Number(v) : 30;

async function series(userId, days) {
  const { rows } = await pool.query(
    `WITH d AS (SELECT generate_series(date_trunc('day', now()) - make_interval(days => $2 - 1), date_trunc('day', now()), '1 day') AS day)
     SELECT day AS date,
       (SELECT count(*)::int FROM leads WHERE user_id=$1 AND date_trunc('day', created_at)=d.day) AS created,
       (SELECT count(*)::int FROM leads WHERE user_id=$1 AND status='Converted' AND date_trunc('day', updated_at)=d.day) AS converted
     FROM d ORDER BY day`,
    [userId, days]
  );
  return rows;
}

const distribution = (column, userId, filter = '', params = []) =>
  pool.query(`SELECT ${column} AS name, count(*)::int AS value FROM leads WHERE user_id=$1 ${filter} GROUP BY ${column} ORDER BY value DESC`, [userId, ...params])
    .then((r) => r.rows);

export async function getAnalytics(userId, days) {
  const inRange = `AND created_at >= date_trunc('day', now()) - make_interval(days => $2 - 1)`;
  const [{ rows: [totals] }, timeline, bySource, byStatus] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS total, count(*) FILTER (WHERE status='Converted')::int AS converted
       FROM leads WHERE user_id=$1 ${inRange}`, [userId, days]),
    series(userId, days),
    distribution('source', userId, inRange, [days]),
    distribution('status', userId, inRange, [days]),
  ]);
  return {
    total: totals.total,
    converted: totals.converted,
    conversionRate: totals.total ? Math.round((totals.converted / totals.total) * 1000) / 10 : 0,
    timeline, bySource, byStatus,
  };
}

export async function getDashboard(userId, days) {
  const [{ rows: [s] }, { rows: [{ pending }] }, byStatus, timeline, attention, upcoming, stale] = await Promise.all([
    pool.query(
      `SELECT count(*)::int AS total,
         count(*) FILTER (WHERE score >= 70 AND status NOT IN ('Converted','Lost'))::int AS hot,
         count(*) FILTER (WHERE status='Converted')::int AS converted,
         count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS new_this_week
       FROM leads WHERE user_id=$1`, [userId]),
    pool.query(`SELECT count(*)::int AS pending FROM follow_ups WHERE user_id=$1 AND status='pending'`, [userId]),
    distribution('status', userId),
    series(userId, days),
    pool.query(
      `SELECT id, name, company, score, status, last_contacted_at FROM leads
       WHERE user_id=$1 AND status NOT IN ('Converted','Lost') AND score >= 40
         AND (last_contacted_at IS NULL OR last_contacted_at < now() - interval '3 days')
       ORDER BY score DESC LIMIT 5`, [userId]).then((r) => r.rows),
    pool.query(
      `SELECT f.id, f.lead_id, f.subject, f.scheduled_at, f.status, l.name AS lead_name
       FROM follow_ups f JOIN leads l ON l.id=f.lead_id
       WHERE f.user_id=$1 AND f.status='pending' ORDER BY f.scheduled_at LIMIT 5`, [userId]).then((r) => r.rows),
    getStaleLeads(userId),
  ]);
  return { summary: { ...s, pending }, byStatus, timeline, attention, upcoming, stale };
}
