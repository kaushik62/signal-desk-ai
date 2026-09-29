import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const followUpQueue = new Queue('follow-ups', {
  connection: redis,
});

export const maintenanceQueue = new Queue('maintenance', {
  connection: redis,
});

// Handle errors
followUpQueue.on('error', (error) => {
  console.error('Follow-up queue error:', error.message);
});

maintenanceQueue.on('error', (error) => {
  console.error('Maintenance queue error:', error.message);
});