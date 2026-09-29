import { pool } from '../config/db.js';
import { followUpQueue } from './queue.js';
import { withTimeout } from '../config/redis.js';
import { httpError } from '../middleware/errorHandler.js';
import { isUuid } from '../middleware/auth.js';

const BACKOFF_MS = 30000;

async function enqueue(fu) {
  const delay = Math.max(0, new Date(fu.scheduled_at) - Date.now());
  await withTimeout(followUpQueue.add('send', { followUpId: fu.id }, {
    jobId: fu.id,
    delay,
    attempts: 5,
    backoff: { type: 'exponential', delay: BACKOFF_MS },
    removeOnComplete: true,
  }), 3000);
}

async function removeJob(id) {
  try {
    const job = await withTimeout(followUpQueue.getJob(id), 3000);
    if (job) await job.remove();
  } catch (e) {
    console.error('Could not remove job', id, e.message);
  }
}

export async function scheduleFollowUp(userId, { leadId, subject, emailBody, scheduledAt } = {}) {
  if (!isUuid(leadId)) throw httpError(400, 'A valid lead is required');
  const { rows: [lead] } = await pool.query('SELECT status FROM leads WHERE id=$1 AND user_id=$2', [leadId, userId]);
  if (!lead) throw httpError(404, 'Lead not found');
  if (['Converted', 'Lost'].includes(lead.status)) throw httpError(400, `Cannot email a ${lead.status.toLowerCase()} lead`);

  const errors = {};
  if (!subject?.trim() || subject.length > 200) errors.subject = 'Subject is required (max 200 characters)';
  if (!emailBody?.trim() || emailBody.length > 4000) errors.emailBody = 'Email body is required (max 4000 characters)';
  const when = scheduledAt ? new Date(scheduledAt) : new Date();
  if (Number.isNaN(when.getTime())) errors.scheduledAt = 'Enter a valid date and time';
  else if (scheduledAt && when.getTime() < Date.now() - 60000) errors.scheduledAt = 'Choose a time in the future';
  if (Object.keys(errors).length) throw httpError(400, 'Fix the highlighted fields', errors);

  const { rows: [fu] } = await pool.query(
    `INSERT INTO follow_ups (user_id, lead_id, subject, email_body, scheduled_at)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [userId, leadId, subject.trim(), emailBody.trim(), when]
  );
  // If Redis is down the row stays pending and reconcile() queues it when Redis returns.
  await enqueue(fu).catch((e) => console.error('Enqueue failed, will reconcile:', e.message));
  return fu;
}

export async function listFollowUps(userId, { status, leadId } = {}) {
  const params = [userId];
  let where = 'f.user_id=$1';
  if (status) { params.push(status); where += ` AND f.status=$${params.length}`; }
  if (leadId) { params.push(leadId); where += ` AND f.lead_id=$${params.length}`; }
  const { rows } = await pool.query(
    `SELECT f.*, l.name AS lead_name FROM follow_ups f JOIN leads l ON l.id=f.lead_id
     WHERE ${where} ORDER BY f.scheduled_at DESC LIMIT 200`,
    params
  );
  return rows;
}

export async function cancelFollowUp(userId, id) {
  const { rows: [fu] } = await pool.query(
    `UPDATE follow_ups SET status='cancelled' WHERE id=$1 AND user_id=$2 AND status='pending' RETURNING *`,
    [id, userId]
  );
  if (!fu) throw httpError(409, 'Only pending follow-ups can be cancelled');
  await removeJob(id);
  return fu;
}

export async function retryFollowUp(userId, id) {
  const { rows: [fu] } = await pool.query(
    `UPDATE follow_ups SET status='pending', scheduled_at=now() WHERE id=$1 AND user_id=$2 AND status='failed' RETURNING *`,
    [id, userId]
  );
  if (!fu) throw httpError(409, 'Only failed follow-ups can be retried');
  await removeJob(id);
  await enqueue(fu).catch((e) => console.error('Enqueue failed, will reconcile:', e.message));
  return fu;
}

export async function cancelForLead(leadId) {
  const { rows } = await pool.query(
    `UPDATE follow_ups SET status='cancelled' WHERE lead_id=$1 AND status='pending' RETURNING id`,
    [leadId]
  );
  await Promise.all(rows.map((r) => removeJob(r.id)));
}

// Re-queue pending follow-ups that have no job (after a Redis restart or a failed enqueue).
export async function reconcile() {
  try {
    const { rows } = await pool.query(`SELECT id, scheduled_at FROM follow_ups WHERE status='pending'`);
    for (const fu of rows) {
      if (!(await followUpQueue.getJob(fu.id))) await enqueue(fu);
    }
  } catch (e) {
    console.error('Reconcile failed:', e.message);
  }
}
