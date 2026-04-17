import type { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  runScheduledNotificationsJob,
  ScheduledNotificationsJobData,
} from '@/jobs/notifications/scheduled-notifications.job';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

const QUEUE_NAME = QUEUE_NAMES.NOTIFICATIONS_SCHEDULED;

/** Every 60 seconds — matches the legacy in-process scheduler. */
const EVERY_MINUTE_MS = 60_000;

export const SCHEDULED_NOTIFICATIONS_REPEAT_JOB_NAME =
  'scheduled-notifications-tick';

let queueInstance: Queue<ScheduledNotificationsJobData> | null = null;

export function getScheduledNotificationsQueue(): Queue<ScheduledNotificationsJobData> {
  if (!queueInstance) {
    queueInstance = createQueue<ScheduledNotificationsJobData>(QUEUE_NAME);
  }
  return queueInstance;
}

export async function queueScheduledNotificationsOnce(
  data: ScheduledNotificationsJobData = { trigger: 'manual' },
  options?: { jobId?: string },
) {
  return getScheduledNotificationsQueue().add(QUEUE_NAME, data, {
    jobId: options?.jobId,
  });
}

export function startScheduledNotificationsQueueWorker() {
  return createWorker<ScheduledNotificationsJobData>(
    QUEUE_NAME,
    async (job: Job<ScheduledNotificationsJobData>) => {
      await runScheduledNotificationsJob(job.data ?? { trigger: 'cron' });
    },
    {
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    },
  );
}

export async function scheduleScheduledNotificationsRepeatable(): Promise<void> {
  const queue = getScheduledNotificationsQueue();

  try {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === SCHEDULED_NOTIFICATIONS_REPEAT_JOB_NAME) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    logger.warn(
      { err },
      '[ScheduledNotificationsQueue] Failed to clean up existing repeatables',
    );
  }

  await queue.add(
    SCHEDULED_NOTIFICATIONS_REPEAT_JOB_NAME,
    { trigger: 'cron' },
    {
      repeat: { every: EVERY_MINUTE_MS },
      attempts: 1,
    },
  );

  logger.info(
    { everyMs: EVERY_MINUTE_MS },
    '[ScheduledNotificationsQueue] Minute repeatable scheduled',
  );
}

export async function unscheduleScheduledNotificationsRepeatable(): Promise<void> {
  const queue = getScheduledNotificationsQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === SCHEDULED_NOTIFICATIONS_REPEAT_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
