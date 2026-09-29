import { Worker } from 'bullmq';
import { pool } from '../config/db.js';
import { redis } from '../config/redis.js';
import { maintenanceQueue } from '../services/queue.js';
import { sendEmail } from '../services/emailService.js';
import { reconcile } from '../services/followUpService.js';
import { recalcScore } from '../services/leadService.js';
import { scanStale } from '../services/staleService.js';

async function processFollowUp(job) {
  const id = job.data.followUpId;
  const { rows: [fu] } = await pool.query(
    `SELECT f.*, l.email AS lead_email, l.status AS lead_status
     FROM follow_ups f JOIN leads l ON l.id = f.lead_id WHERE f.id=$1`, [id]);
  if (!fu || fu.status !== 'pending') return;

  if (['Converted', 'Lost'].includes(fu.lead_status)) {
    await pool.query(`UPDATE follow_ups SET status='cancelled' WHERE id=$1 AND status='pending'`, [id]);
    return;
  }

  // Claim the row so a duplicate job cannot send the same email twice.
  const claimed = await pool.query(`UPDATE follow_ups SET status='sending' WHERE id=$1 AND status='pending'`, [id]);
  if (!claimed.rowCount) return;

  try {
    await sendEmail({ to: fu.lead_email, subject: fu.subject, text: fu.email_body });
  } catch (err) {
    await pool.query(`UPDATE follow_ups SET status='pending' WHERE id=$1 AND status='sending'`, [id]);
    throw err;
  }

  await pool.query(`UPDATE follow_ups SET status='sent', sent_at=now() WHERE id=$1`, [id]);
  await pool.query(
    `UPDATE leads SET last_contacted_at=now(), updated_at=now(),
       status = CASE WHEN status='New' THEN 'Contacted' ELSE status END WHERE id=$1`, [fu.lead_id]);
  await recalcScore(fu.lead_id);
  await scanStale().catch((e) => console.error('Stale scan failed:', e.message));
}

export async function startWorkers() {
  // A row left in 'sending' means the process died mid-send. Mark it failed so the user can retry it.
  await pool.query(`UPDATE follow_ups SET status='failed' WHERE status='sending'`);

  const followUps = new Worker('follow-ups', processFollowUp, { connection: redis, concurrency: 5 });
  followUps.on('error', (e) => console.error('Follow-up worker:', e.message));
  followUps.on('failed', async (job, err) => {
    console.error(`Follow-up ${job?.data?.followUpId} failed (attempt ${job?.attemptsMade}):`, err.message);
    if (job && job.attemptsMade >= (job.opts?.attempts ?? 1)) {
      await pool.query(`UPDATE follow_ups SET status='failed' WHERE id=$1 AND status='pending'`, [job.data.followUpId]);
    }
  });

  const maintenance = new Worker('maintenance', () => scanStale(), { connection: redis });
  maintenance.on('error', (e) => console.error('Maintenance worker:', e.message));

  // The scheduler id makes this idempotent: restarting never adds a second recurring job.
  await maintenanceQueue.upsertJobScheduler('stale-scan', { every: 10 * 60 * 1000 }, { name: 'scan' });

  redis.on('ready', reconcile);
  await reconcile();
  await scanStale().catch((e) => console.error('Stale scan failed:', e.message));
  return [followUps, maintenance];
}
