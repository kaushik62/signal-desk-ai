import { pool } from '../config/db.js';
import { followUpQueue } from './queue.js';
import { withTimeout } from '../config/redis.js';
import { httpError } from '../middleware/errorHandler.js';
import { isUuid } from '../middleware/auth.js';

const RETRY_DELAY = 30000;

// Add a follow-up to BullMQ
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
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: RETRY_DELAY,
        },
        removeOnComplete: true,
      }
    ),
    3000
  );
}

// Remove a job from BullMQ
async function removeJob(followUpId) {
  try {
    const job = await withTimeout(
      followUpQueue.getJob(followUpId),
      3000
    );

    if (job && await job.isFinished() === false) {
      await job.remove();
    }
  } catch (error) {
    console.error('Could not remove job:', error.message);
  }
}

// Schedule a follow-up
export async function scheduleFollowUp(
  userId,
  { leadId, subject, emailBody, scheduledAt } = {}
) {
  if (!isUuid(leadId)) {
    throw httpError(400, 'A valid lead is required');
  }

  const leadResult = await pool.query(
    `SELECT status
     FROM leads
     WHERE id = $1 AND user_id = $2`,
    [leadId, userId]
  );

  const lead = leadResult.rows[0];

  if (!lead) {
    throw httpError(404, 'Lead not found');
  }

  if (['Converted', 'Lost'].includes(lead.status)) {
    throw httpError(400, 'Cannot email a converted or lost lead');
  }

  const errors = {};

  if (!subject?.trim() || subject.length > 200) {
    errors.subject = 'Subject is required (max 200 characters)';
  }

  if (!emailBody?.trim() || emailBody.length > 4000) {
    errors.emailBody = 'Email body is required (max 4000 characters)';
  }

  const scheduledTime = scheduledAt
    ? new Date(scheduledAt)
    : new Date();

  if (Number.isNaN(scheduledTime.getTime())) {
    errors.scheduledAt = 'Enter a valid date and time';
  } else if (scheduledAt && scheduledTime.getTime() < Date.now() - 60000) {
    errors.scheduledAt = 'Choose a time in the future';
  }

  if (Object.keys(errors).length > 0) {
    throw httpError(400, 'Fix the highlighted fields', errors);
  }

  const result = await pool.query(
    `INSERT INTO follow_ups
       (user_id, lead_id, subject, email_body, scheduled_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, leadId, subject.trim(), emailBody.trim(), scheduledTime]
  );

  const followUp = result.rows[0];

  // Save in PostgreSQL even if Redis is unavailable
  try {
    await addJob(followUp);
  } catch (error) {
    console.error('Could not queue follow-up:', error.message);
  }

  return followUp;
}

// Get follow-ups
export async function listFollowUps(userId, { status, leadId } = {}) {
  let query = `
    SELECT f.*, l.name AS lead_name
    FROM follow_ups f
    JOIN leads l ON l.id = f.lead_id
    WHERE f.user_id = $1
  `;

  const params = [userId];

  if (status) {
    params.push(status);
    query += ` AND f.status = $${params.length}`;
  }

  if (leadId) {
    params.push(leadId);
    query += ` AND f.lead_id = $${params.length}`;
  }

  query += ' ORDER BY f.scheduled_at DESC LIMIT 200';

  const result = await pool.query(query, params);

  return result.rows;
}

// Cancel a pending follow-up
export async function cancelFollowUp(userId, followUpId) {
  const result = await pool.query(
    `UPDATE follow_ups
     SET status = 'cancelled'
     WHERE id = $1
       AND user_id = $2
       AND status = 'pending'
     RETURNING *`,
    [followUpId, userId]
  );

  const followUp = result.rows[0];

  if (!followUp) {
    throw httpError(409, 'Only pending follow-ups can be cancelled');
  }

  await removeJob(followUpId);

  return followUp;
}

// Retry a failed follow-up immediately
export async function retryFollowUp(userId, followUpId) {
  const result = await pool.query(
    `UPDATE follow_ups
     SET status = 'pending',
         scheduled_at = NOW()
     WHERE id = $1
       AND user_id = $2
       AND status = 'failed'
     RETURNING *`,
    [followUpId, userId]
  );

  const followUp = result.rows[0];

  if (!followUp) {
    throw httpError(409, 'Only failed follow-ups can be retried');
  }

  await removeJob(followUpId);

  try {
    await addJob(followUp);
  } catch (error) {
    console.error('Could not queue follow-up:', error.message);
  }

  return followUp;
}

// Cancel pending follow-ups for a lead
export async function cancelForLead(leadId) {
  const result = await pool.query(
    `UPDATE follow_ups
     SET status = 'cancelled'
     WHERE lead_id = $1
       AND status = 'pending'
     RETURNING id`,
    [leadId]
  );

  await Promise.all(
    result.rows.map((followUp) => removeJob(followUp.id))
  );
}

// Restore pending follow-ups missing from BullMQ
export async function reconcile() {
  try {
    const result = await pool.query(
      `SELECT id, scheduled_at
       FROM follow_ups
       WHERE status = 'pending'`
    );

    for (const followUp of result.rows) {
      const job = await followUpQueue.getJob(followUp.id);

      if (!job) {
        await addJob(followUp);
      }
    }
  } catch (error) {
    console.error('Could not restore follow-up jobs:', error.message);
  }
}