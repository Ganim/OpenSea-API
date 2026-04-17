import type { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  runPayrollGenerationJob,
  PayrollGenerationJobData,
} from '@/jobs/hr/payroll-generation.job';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

const QUEUE_NAME = QUEUE_NAMES.HR_PAYROLL_GENERATION;

/** Monthly, day 25 at 03:00 UTC — matches the legacy in-process scheduler. */
const MONTHLY_DAY25_03_UTC_CRON = '0 3 25 * *';

export const PAYROLL_GENERATION_REPEAT_JOB_NAME =
  'hr-payroll-generation-monthly';

let queueInstance: Queue<PayrollGenerationJobData> | null = null;

export function getPayrollGenerationQueue(): Queue<PayrollGenerationJobData> {
  if (!queueInstance) {
    queueInstance = createQueue<PayrollGenerationJobData>(QUEUE_NAME);
  }
  return queueInstance;
}

export async function queuePayrollGenerationOnce(
  data: PayrollGenerationJobData = { trigger: 'manual' },
  options?: { jobId?: string },
) {
  return getPayrollGenerationQueue().add(QUEUE_NAME, data, {
    jobId: options?.jobId,
  });
}

export function startPayrollGenerationQueueWorker() {
  return createWorker<PayrollGenerationJobData>(
    QUEUE_NAME,
    async (job: Job<PayrollGenerationJobData>) => {
      await runPayrollGenerationJob(job.data ?? { trigger: 'cron' });
    },
    {
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    },
  );
}

export async function schedulePayrollGenerationRepeatable(): Promise<void> {
  const queue = getPayrollGenerationQueue();

  try {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === PAYROLL_GENERATION_REPEAT_JOB_NAME) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    logger.warn(
      { err },
      '[PayrollGenerationQueue] Failed to clean up existing repeatables',
    );
  }

  await queue.add(
    PAYROLL_GENERATION_REPEAT_JOB_NAME,
    { trigger: 'cron' },
    {
      repeat: { pattern: MONTHLY_DAY25_03_UTC_CRON, tz: 'UTC' },
      attempts: 1,
    },
  );

  logger.info(
    { cron: MONTHLY_DAY25_03_UTC_CRON, tz: 'UTC' },
    '[PayrollGenerationQueue] Monthly repeatable scheduled',
  );
}

export async function unschedulePayrollGenerationRepeatable(): Promise<void> {
  const queue = getPayrollGenerationQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === PAYROLL_GENERATION_REPEAT_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
