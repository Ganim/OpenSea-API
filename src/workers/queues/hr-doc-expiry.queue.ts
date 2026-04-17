import type { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  runDocExpiryJob,
  DocExpiryJobData,
} from '@/jobs/hr/doc-expiry.job';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

const QUEUE_NAME = QUEUE_NAMES.HR_DOC_EXPIRY;

/** Daily at 08:00 UTC — matches the legacy in-process scheduler. */
const DAILY_08_UTC_CRON = '0 8 * * *';

export const DOC_EXPIRY_REPEAT_JOB_NAME = 'hr-doc-expiry-daily';

let queueInstance: Queue<DocExpiryJobData> | null = null;

export function getDocExpiryQueue(): Queue<DocExpiryJobData> {
  if (!queueInstance) {
    queueInstance = createQueue<DocExpiryJobData>(QUEUE_NAME);
  }
  return queueInstance;
}

export async function queueDocExpiryOnce(
  data: DocExpiryJobData = { trigger: 'manual' },
  options?: { jobId?: string },
) {
  return getDocExpiryQueue().add(QUEUE_NAME, data, { jobId: options?.jobId });
}

export function startDocExpiryQueueWorker() {
  return createWorker<DocExpiryJobData>(
    QUEUE_NAME,
    async (job: Job<DocExpiryJobData>) => {
      await runDocExpiryJob(job.data ?? { trigger: 'cron' });
    },
    {
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    },
  );
}

export async function scheduleDocExpiryRepeatable(): Promise<void> {
  const queue = getDocExpiryQueue();

  try {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === DOC_EXPIRY_REPEAT_JOB_NAME) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    logger.warn(
      { err },
      '[DocExpiryQueue] Failed to clean up existing repeatables',
    );
  }

  await queue.add(
    DOC_EXPIRY_REPEAT_JOB_NAME,
    { trigger: 'cron' },
    {
      repeat: { pattern: DAILY_08_UTC_CRON, tz: 'UTC' },
      attempts: 1,
    },
  );

  logger.info(
    { cron: DAILY_08_UTC_CRON, tz: 'UTC' },
    '[DocExpiryQueue] Daily repeatable scheduled',
  );
}

export async function unscheduleDocExpiryRepeatable(): Promise<void> {
  const queue = getDocExpiryQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === DOC_EXPIRY_REPEAT_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
