import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';

export const followUpQueue = new Queue('follow-ups', {
  
  connection: redis,

  defaultJobOptions: {
    attempts: 5,

    backoff: {
      type: 'exponential',
      delay: 30000,
    },

    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Handle queue errors
followUpQueue.on('error', (error) => {
  console.error('Follow-up queue error:', error.message);
});

// Close queue during graceful shutdown
export async function closeQueues() {
  await followUpQueue.close();
}