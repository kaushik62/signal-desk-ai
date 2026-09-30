import { pool } from '../config/db.js';
import { followUpQueue } from './queue.js';
import { withTimeout } from '../config/redis.js';
import { httpError } from '../middleware/errorHandler.js';
import { isUuid } from '../middleware/auth.js';

// Add a follow-up job to BullMQ.
async function addJob(followUp) {
  const delay = Math.max(
    0,
    new Date(followUp.scheduled_at).getTime() - Date.now()
  );

  await withTimeout(
    followUpQueue.add(
      'send',
      { followUpId: followUp.id },
      {
        jobId: followUp.id,
        delay,
      }
    ),
    5000
  );
}

// Remove a job from BullMQ.

async function removeJob(id) {
  try {
    const job = await withTimeout(
      followUpQueue.getJob(id),
      3000
    );

    if (!job) return;

    const state = await withTimeout(
      job.getState(),
      3000
    );

    if (state === 'waiting' || state === 'delayed' || state === 'waiting-children') {
      await withTimeout(job.remove(), 3000);
    }
  } catch (error) {
    console.error('Could not remove job:', error.message);
  }
}

// Validate follow-up input.
function validateFollowUp(data) {
  const errors = {};

  const subject = data.subject;
  const emailBody = data.emailBody;
  const scheduledAt = data.scheduledAt;

  if (
    typeof subject !== 'string' ||
    !subject.trim() ||
    subject.trim().length > 200
  ) {
    errors.subject = 'Subject is required (max 200 characters)';
  }

  if (
    typeof emailBody !== 'string' ||
    !emailBody.trim() ||
    emailBody.trim().length > 4000
  ) {
    errors.emailBody = 'Email body is required (max 4000 characters)';
  }

  const scheduledTime = scheduledAt
    ? new Date(scheduledAt)
    : new Date();

  if (Number.isNaN(scheduledTime.getTime())) {
    errors.scheduledAt = 'Enter a valid date and time';
  } else if (
    scheduledAt &&
    scheduledTime.getTime() < Date.now() - 60000
  ) {
    errors.scheduledAt = 'Choose a time in the future';
  }

  if (Object.keys(errors).length > 0) {
    throw httpError(400, 'Fix the highlighted fields', errors);
  }

  return {
    subject: subject.trim(),
    emailBody: emailBody.trim(),
    scheduledTime,
  };
}

// Create and schedule a follow-up.
export async function scheduleFollowUp(userId, data) {
  const { leadId } = data;

  if (!isUuid(leadId)) {
    throw httpError(400, 'A valid lead is required');
  }

  const { subject, emailBody, scheduledTime } =
    validateFollowUp(data);

  const { rows } = await pool.query(
    `SELECT status
     FROM leads
     WHERE id = $1
       AND user_id = $2`,
    [leadId, userId]
  );

  const lead = rows[0];

  if (!lead) {
    throw httpError(404, 'Lead not found');
  }

  if (['Converted', 'Lost'].includes(lead.status)) {
    throw httpError(400, 'Cannot email a converted or lost lead');
  }

  const result = await pool.query(
    `INSERT INTO follow_ups
       (user_id, lead_id, subject, email_body, scheduled_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, leadId, subject, emailBody, scheduledTime]
  );

  const followUp = result.rows[0];

  try {
    await addJob(followUp);
  } catch (error) {

    // reconcile() can restore it when Redis is available.

    console.error('Could not queue follow-up:', error.message);
  }

  return followUp;
}

// Get a user's follow-ups.
export async function listFollowUps(userId, data = {}) {
  const { status, leadId } = data;

  const params = [userId];

  let query = `
    SELECT f.*, l.name AS lead_name
    FROM follow_ups f
    JOIN leads l ON l.id = f.lead_id
    WHERE f.user_id = $1
  `;

  if (status) {
    params.push(status);
    query += ` AND f.status = $${params.length}`;
  }

  if (leadId) {
    if (!isUuid(leadId)) {
      throw httpError(400, 'A valid lead is required');
    }

    params.push(leadId);
    query += ` AND f.lead_id = $${params.length}`;
  }

  query += ' ORDER BY f.scheduled_at DESC LIMIT 10';

  const { rows } = await pool.query(query, params);

  return rows;
}

// Cancel a pending follow-up.
export async function cancelFollowUp(userId, followUpId) {
  if (!isUuid(followUpId)) {
    throw httpError(400, 'A valid follow-up is required');
  }

  const { rows: [followUp] } = await pool.query(
    `UPDATE follow_ups
     SET status = 'cancelled'
     WHERE id = $1
       AND user_id = $2
       AND status = 'pending'
     RETURNING *`,
    [followUpId, userId]
  );

  if (!followUp) {
    throw httpError(
      409,
      'Only pending follow-ups can be cancelled'
    );
  }

  await removeJob(followUpId);

  return followUp;
}

// Retry a failed follow-up immediately.
export async function retryFollowUp(userId, followUpId) {
  if (!isUuid(followUpId)) {
    throw httpError(400, 'A valid follow-up is required');
  }

  const { rows: [followUp] } = await pool.query(
    `UPDATE follow_ups
     SET status = 'pending',
         scheduled_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND status = 'failed'
     RETURNING *`,
    [followUpId, userId]
  );

  if (!followUp) {
    throw httpError(
      409,
      'Only failed follow-ups can be retried'
    );
  }

  try {
    
    // remove it first so the new job can be added.
    const existingJob = await followUpQueue.getJob(followUpId);

    if (existingJob) {
      const state = await existingJob.getState();

      if (
        state === 'failed' ||
        state === 'completed' ||
        state === 'waiting' ||
        state === 'delayed'
      ) {
        await existingJob.remove();
      }
    }

    await addJob(followUp);
  } catch (error) {
    console.error('Could not queue follow-up:', error.message);
  }

  return followUp;
}

// Cancel all pending follow-ups for a lead.
export async function cancelForLead(leadId) {
  const { rows } = await pool.query(
    `UPDATE follow_ups
     SET status = 'cancelled'
     WHERE lead_id = $1
       AND status = 'pending'
     RETURNING id`,
    [leadId]
  );

  for (const followUp of rows) {
    await removeJob(followUp.id);
  }
}

// Restore pending follow-ups missing from BullMQ.
export async function reconcile() {
  try {
    const { rows } = await pool.query(
      `SELECT id, scheduled_at
       FROM follow_ups
       WHERE status = 'pending'`
    );

    for (const followUp of rows) {
      const job = await withTimeout(
        followUpQueue.getJob(followUp.id),
        3000
      );

      if (!job) {
        await addJob(followUp);
      }
    }
  } catch (error) {
    console.error(
      'Could not restore follow-up jobs:',
      error.message
    );
  }
}