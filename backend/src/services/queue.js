import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

const defaultJobOptions = {
  attempts: 5,

  backoff: {
    type: 'exponential',
    delay: 30000,
  },

  removeOnComplete: true,
  removeOnFail: false,
};

export const followUpQueue = new Queue('follow-ups', {
  connection: redis,
  defaultJobOptions,
});

export const maintenanceQueue = new Queue('maintenance', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: 'exponential',
      delay: 5000,
    },

    removeOnComplete: true,
    removeOnFail: 100,
  },
});

// Handle queue errors
followUpQueue.on('error', (error) => {
  console.error('Follow-up queue error:', error.message);
});

maintenanceQueue.on('error', (error) => {
  console.error('Maintenance queue error:', error.message);
});

// Close queues during graceful shutdown
export async function closeQueues() {
  await Promise.allSettled([
    followUpQueue.close(),
    maintenanceQueue.close(),
  ]);
}