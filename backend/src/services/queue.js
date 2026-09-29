import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const followUpQueue = new Queue('follow-ups', { connection: redis });
export const maintenanceQueue = new Queue('maintenance', { connection: redis });

for (const q of [followUpQueue, maintenanceQueue]) q.on('error', (e) => console.error(`Queue ${q.name}:`, e.message));
