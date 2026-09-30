import { Worker } from 'bullmq';

import { pool } from '../config/db.js';
import { redisConfig } from '../config/redis.js';

import { sendEmail } from '../services/emailService.js';
import { reconcile } from '../services/followUpService.js';
import { recalcScore } from '../services/leadService.js';
import { clearStaleCache } from '../services/staleService.js';

async function updateFollowUpStatus(followUpId, status) {
  await pool.query(
    `UPDATE follow_ups
     SET status = $2
     WHERE id = $1
       AND status IN ('sending', 'processing')`,
    [followUpId, status]
  );
}

// Process a follow-up job.
async function processFollowUp(job) {
  const { followUpId } = job.data;

  // Atomically claim the pending follow-up. Only transition from 'pending' to 'sending'
  // to prevent race conditions or duplicate sends between workers.
  const followUpResult = await pool.query(
    `UPDATE follow_ups
     SET status = 'sending'
     WHERE id = $1
       AND status = 'pending'
       AND EXISTS (
         SELECT 1
         FROM leads
         WHERE leads.id = follow_ups.lead_id
           AND leads.status NOT IN ('Converted', 'Lost')
       )
     RETURNING *`,
    [followUpId]
  );

  const followUp = followUpResult.rows[0];

  if (!followUp) {
    // Check if the follow-up was pending but the lead was converted or lost
    await pool.query(
      `UPDATE follow_ups
       SET status = 'cancelled'
       WHERE id = $1
         AND status = 'pending'
         AND EXISTS (
           SELECT 1
           FROM leads
           WHERE leads.id = follow_ups.lead_id
             AND leads.status IN ('Converted', 'Lost')
         )`,
      [followUpId]
    );

    // If already sent or claimed by another worker, do not duplicate
    return;
  }

  // Get the lead and its owner.
  const leadResult = await pool.query(
    `SELECT email, status, user_id
     FROM leads
     WHERE id = $1`,
    [followUp.lead_id]
  );

  const lead = leadResult.rows[0];

  if (!lead || ['Converted', 'Lost'].includes(lead.status) || !lead.email) {
    await updateFollowUpStatus(followUpId, 'cancelled');
    return;
  }

  // Send the email.
  try {
    await sendEmail({
      to: lead.email,
      subject: followUp.subject,
      text: followUp.email_body,
    });
  } catch (error) {
    // BullMQ will retry the job.
    const maxAttempts = job.opts?.attempts ?? 5;
    const isLastAttempt = (job.attemptsMade ?? 0) + 1 >= maxAttempts;

    try {
      await updateFollowUpStatus(
        followUpId,
        isLastAttempt ? 'failed' : 'pending'
      );
    } catch (dbError) {
      // Preserve the original email error.
      console.error(
        'Failed to update follow-up status on email failure:',
        dbError.message
      );
    }

    throw error;
  }

  // Mark follow-up as sent.
  try {
    await pool.query(
      `UPDATE follow_ups
       SET status = 'sent',
           sent_at = NOW()
       WHERE id = $1
         AND status IN ('sending', 'processing')`,
      [followUpId]
    );
  } catch (error) {
    console.error(
      'Email sent, but failed to mark follow-up as sent:',
      error.message
    );
    return;
  }

  // Update the lead after recording the successful email.
  try {
    await pool.query(
      `UPDATE leads
       SET last_contacted_at = NOW(),
           updated_at = NOW(),
           status = CASE
             WHEN status = 'New' THEN 'Contacted'
             ELSE status
           END
       WHERE id = $1`,
      [followUp.lead_id]
    );

    await recalcScore(followUp.lead_id);
  } catch (error) {
    console.error(
      'Email sent, but failed to update lead:',
      error.message
    );
  }

  // Cache cleanup must not cause the email job to be retried.
  try {
    await clearStaleCache(lead.user_id);
  } catch (error) {
    console.error(
      'Failed to clear stale-lead cache:',
      error.message
    );
  }
}

// Start BullMQ workers.
export async function startWorkers() {
  const followUpWorker = new Worker(
    'follow-ups',
    processFollowUp,
    {
      connection: redisConfig,
      concurrency: 5,
    }
  );

  followUpWorker.on('error', (error) => {
    console.error(
      'Follow-up worker error:',
      error.message
    );
  });

  followUpWorker.on('failed', (job, error) => {
    console.error(
      `Follow-up job ${job?.id} failed:`,
      error.message
    );
  });

  // Restore pending follow-ups to the queue and reconcile stuck jobs.
  await reconcile();

  return [followUpWorker];
}