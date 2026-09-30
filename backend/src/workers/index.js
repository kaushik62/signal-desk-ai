import { Worker } from 'bullmq';

import { pool } from '../config/db.js';
import { redis } from '../config/redis.js';
import { maintenanceQueue } from '../services/queue.js';
import { sendEmail } from '../services/emailService.js';
import { reconcile } from '../services/followUpService.js';
import { recalcScore } from '../services/leadService.js';
import { scanStale } from '../services/staleService.js';

async function processFollowUp(job) {
  const { followUpId } = job.data;

  // Atomically claim the follow-up so two workers
  // cannot process the same pending record together.
  const { rows: [followUp] } = await pool.query(
    `UPDATE follow_ups
     SET status = 'processing'
     WHERE id = $1
       AND status = 'pending'
       AND EXISTS (
         SELECT 1
         FROM leads l
         WHERE l.id = follow_ups.lead_id
           AND l.status NOT IN ('Converted', 'Lost')
       )
     RETURNING *`,
    [followUpId]
  );

  // Another worker may already have claimed it,
  // or it may have been cancelled or completed.
  if (!followUp) {
    const { rows: [existing] } = await pool.query(
      `SELECT f.status, l.status AS lead_status
       FROM follow_ups f
       JOIN leads l ON l.id = f.lead_id
       WHERE f.id = $1`,
      [followUpId]
    );

    if (
      existing &&
      existing.status === 'pending' &&
      ['Converted', 'Lost'].includes(existing.lead_status)
    ) {
      await pool.query(
        `UPDATE follow_ups
         SET status = 'cancelled'
         WHERE id = $1 AND status = 'pending'`,
        [followUpId]
      );
    }

    return;
  }

  try {
    // Fetch the lead details after claiming the follow-up.
    const { rows: [lead] } = await pool.query(
      `SELECT id, email, status
       FROM leads
       WHERE id = $1`,
      [followUp.lead_id]
    );

    if (!lead || ['Converted', 'Lost'].includes(lead.status)) {
      await pool.query(
        `UPDATE follow_ups
         SET status = 'cancelled'
         WHERE id = $1 AND status = 'processing'`,
        [followUpId]
      );

      return;
    }

    await sendEmail({
      to: lead.email,
      subject: followUp.subject,
      text: followUp.email_body,
    });

    await pool.query(
      `UPDATE follow_ups
       SET status = 'sent',
           sent_at = NOW()
       WHERE id = $1 AND status = 'processing'`,
      [followUpId]
    );

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
    const maxAttempts = job.opts.attempts ?? 1;
    const isLastAttempt = job.attemptsMade + 1 >= maxAttempts;

    // Let BullMQ retry failed jobs. Only mark the record
    // failed when no more attempts remain.
    await pool.query(
      `UPDATE follow_ups
       SET status = $2
       WHERE id = $1 AND status = 'processing'`,
      [followUpId, isLastAttempt ? 'failed' : 'pending']
    );

    throw error;
  }
}

async function processMaintenance(job) {
  if (job.name === 'scan') {
    await scanStale();
  }
}

export async function startWorkers() {
  const followUpWorker = new Worker(
    'follow-ups',
    processFollowUp,
    {
      connection: redis,
      concurrency: 5,
    }
  );

  const maintenanceWorker = new Worker(
    'maintenance',
    processMaintenance,
    {
      connection: redis,
      concurrency: 1,
    }
  );

  followUpWorker.on('error', (error) => {
    console.error('Follow-up worker error:', error.message);
  });

  followUpWorker.on('failed', (job, error) => {
    console.error(
      `Follow-up job ${job?.id ?? 'unknown'} failed:`,
      error.message
    );
  });

  maintenanceWorker.on('error', (error) => {
    console.error('Maintenance worker error:', error.message);
  });

  maintenanceWorker.on('failed', (job, error) => {
    console.error(
      `Maintenance job ${job?.id ?? 'unknown'} failed:`,
      error.message
    );
  });

  await maintenanceQueue.upsertJobScheduler(
    'stale-scan',
    { every: 10 * 60 * 1000 },
    { name: 'scan' }
  );

  await reconcile();
  await scanStale();

  return [followUpWorker, maintenanceWorker];
}