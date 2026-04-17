import type { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  runVacationAccrualJob,
  VacationAccrualJobData,
} from '@/jobs/hr/vacation-accrual.job';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

const QUEUE_NAME = QUEUE_NAMES.HR_VACATION_ACCRUAL;

/** Monthly, day 1 at 02:00 UTC — matches the legacy in-process scheduler. */
const MONTHLY_DAY1_02_UTC_CRON = '0 2 1 * *';

export const VACATION_ACCRUAL_REPEAT_JOB_NAME = 'hr-vacation-accrual-monthly';

let queueInstance: Queue<VacationAccrualJobData> | null = null;

export function getVacationAccrualQueue(): Queue<VacationAccrualJobData> {
  if (!queueInstance) {
    queueInstance = createQueue<VacationAccrualJobData>(QUEUE_NAME);
  }
  return queueInstance;
}

export async function queueVacationAccrualOnce(
  data: VacationAccrualJobData = { trigger: 'manual' },
  options?: { jobId?: string },
) {
  return getVacationAccrualQueue().add(QUEUE_NAME, data, {
    jobId: options?.jobId,
  });
}

export function startVacationAccrualQueueWorker() {
  return createWorker<VacationAccrualJobData>(
    QUEUE_NAME,
    async (job: Job<VacationAccrualJobData>) => {
      await runVacationAccrualJob(job.data ?? { trigger: 'cron' });
    },
    {
      // Accrual is I/O-bound (Prisma per tenant) but single-flighted per month.
      // Low concurrency keeps DB load predictable.
      concurrency: 1,
      limiter: { max: 1, duration: 1000 },
    },
  );
}

export async function scheduleVacationAccrualRepeatable(): Promise<void> {
  const queue = getVacationAccrualQueue();

  try {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === VACATION_ACCRUAL_REPEAT_JOB_NAME) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    logger.warn(
      { err },
      '[VacationAccrualQueue] Failed to clean up existing repeatables',
    );
  }

  await queue.add(
    VACATION_ACCRUAL_REPEAT_JOB_NAME,
    { trigger: 'cron' },
    {
      repeat: { pattern: MONTHLY_DAY1_02_UTC_CRON, tz: 'UTC' },
      // Job is idempotent at use-case level (createdPeriods is month-unique),
      // but a retry does touch Prisma unnecessarily. One attempt + DLQ wins.
      attempts: 1,
    },
  );

  logger.info(
    { cron: MONTHLY_DAY1_02_UTC_CRON, tz: 'UTC' },
    '[VacationAccrualQueue] Monthly repeatable scheduled',
  );
}

export async function unscheduleVacationAccrualRepeatable(): Promise<void> {
  const queue = getVacationAccrualQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === VACATION_ACCRUAL_REPEAT_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
