import { pool } from '../config/db.js';
import { getStaleLeads } from './staleService.js';

// Allow only 7, 30, or 90 days
export function clampDays(days) {
  days = Number(days);

  if (days === 7 || days === 30 || days === 90) {
    return days;
  }

  return 30;
}

// Get leads created each day
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

// Count leads by source or status
async function getDistribution(type, userId) {
  let column = 'status';

  if (type === 'source') {
    column = 'source';
  }

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

// Get analytics
export async function getAnalytics(userId, days) {
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

  const totalLeads = result.rows[0].total;
  const convertedLeads = result.rows[0].converted;

  let conversionRate = 0;

  if (totalLeads > 0) {
    conversionRate = Math.round(
      (convertedLeads / totalLeads) * 1000
    ) / 10;
  }

  const timeline = await getTimeline(userId, days);
  const sourceData = await getDistribution('source', userId);
  const statusData = await getDistribution('status', userId);

  return {
    total: totalLeads,
    converted: convertedLeads,
    conversionRate,
    timeline,
    bySource: sourceData,
    byStatus: statusData,
  };
}

// Get dashboard data
export async function getDashboard(userId, days) {
  // Get lead counts
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

  const leadSummary = result.rows[0];

  // Count pending follow-ups
  const followUpResult = await pool.query(
    `SELECT COUNT(*)::int AS pending
     FROM follow_ups
     WHERE user_id = $1
       AND status = 'pending'`,
    [userId]
  );

  const pendingFollowUps = followUpResult.rows[0].pending;

  // Get chart and stale lead data
  const statusData = await getDistribution('status', userId);
  const timeline = await getTimeline(userId, days);
  const staleLeads = await getStaleLeads(userId);

  return {
    summary: {
      total: leadSummary.total,
      hot: leadSummary.hot,
      converted: leadSummary.converted,
      new_this_week: leadSummary.new_this_week,
      pending: pendingFollowUps,
    },
    byStatus: statusData,
    timeline,
    stale: staleLeads,
  };
}