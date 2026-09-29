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

  const { rows: [followUp] } = await pool.query(
    `SELECT f.*, l.email AS lead_email, l.status AS lead_status
     FROM follow_ups f
     JOIN leads l ON l.id = f.lead_id
     WHERE f.id = $1`,
    [followUpId]
  );

  if (!followUp || followUp.status !== 'pending') return;

  // Cancel follow-ups for completed or lost leads
  if (['Converted', 'Lost'].includes(followUp.lead_status)) {
    await pool.query(
      `UPDATE follow_ups SET status = 'cancelled'
       WHERE id = $1 AND status = 'pending'`,
      [followUpId]
    );
    return;
  }

  // Prevent duplicate emails
  const result = await pool.query(
    `UPDATE follow_ups SET status = 'sending'
     WHERE id = $1 AND status = 'pending'`,
    [followUpId]
  );

  if (!result.rowCount) return;

  try {
    await sendEmail({
      to: followUp.lead_email,
      subject: followUp.subject,
      text: followUp.email_body,
    });
  } catch (error) {
    await pool.query(
      `UPDATE follow_ups SET status = 'pending'
       WHERE id = $1 AND status = 'sending'`,
      [followUpId]
    );

    throw error;
  }

  await pool.query(
    `UPDATE follow_ups SET status = 'sent', sent_at = NOW()
     WHERE id = $1`,
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
  await scanStale();
}

export async function startWorkers() {
  // Recover jobs interrupted while sending
  await pool.query(
    `UPDATE follow_ups SET status = 'failed'
     WHERE status = 'sending'`
  );

  const followUpWorker = new Worker(
    'follow-ups',
    processFollowUp,
    { connection: redis, concurrency: 5 }
  );

  followUpWorker.on('error', (error) => {
    console.error('Follow-up worker:', error.message);
  });

  followUpWorker.on('failed', async (job, error) => {
    console.error('Follow-up failed:', error.message);

    if (job && job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await pool.query(
        `UPDATE follow_ups SET status = 'failed'
         WHERE id = $1 AND status = 'pending'`,
        [job.data.followUpId]
      );
    }
  });

  const maintenanceWorker = new Worker(
    'maintenance',
    () => scanStale(),
    { connection: redis }
  );

  maintenanceWorker.on('error', (error) => {
    console.error('Maintenance worker:', error.message);
  });

  // Run stale-lead scan every 10 minutes
  await maintenanceQueue.upsertJobScheduler(
    'stale-scan',
    { every: 10 * 60 * 1000 },
    { name: 'scan' }
  );

  redis.on('ready', reconcile);

  await reconcile();
  await scanStale();

  return [followUpWorker, maintenanceWorker];
}