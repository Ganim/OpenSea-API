import type { Queue } from 'bullmq';
import { Job } from 'bullmq';
import {
  PaymentReconciliationJobData,
  runPaymentReconciliationJob,
} from '@/jobs/finance/payment-reconciliation.job';
import { logger } from '@/lib/logger';
import { createQueue, createWorker, QUEUE_NAMES } from '@/lib/queue';

const QUEUE_NAME = QUEUE_NAMES.PAYMENT_RECONCILIATION;

/**
 * Cron pattern matching the legacy in-process scheduler:
 *   - Daily at 02:00 UTC (the previous `TARGET_UTC_HOUR = 2` constant).
 * Kept identical so a flag-flip from BULLMQ_ENABLED=false → true does not
 * change the operational cadence.
 */
const DAILY_AT_02_UTC_CRON = '0 2 * * *';

/**
 * Stable repeat job key — used to remove the old repeatable when the cron
 * pattern changes between deploys, and to assert/find it in tests.
 */
export const PAYMENT_RECONCILIATION_REPEAT_JOB_NAME =
  'payment-reconciliation-daily';

let queueInstance: Queue<PaymentReconciliationJobData> | null = null;

export function getPaymentReconciliationQueue(): Queue<PaymentReconciliationJobData> {
  if (!queueInstance) {
    queueInstance = createQueue<PaymentReconciliationJobData>(QUEUE_NAME);
  }
  return queueInstance;
}

/**
 * Enqueue a one-off (non-repeating) reconciliation pass. Useful for admin
 * endpoints, tests, or manual triggers from observability dashboards.
 */
export async function queuePaymentReconciliationOnce(
  data: PaymentReconciliationJobData = { trigger: 'manual' },
  options?: { jobId?: string },
) {
  return getPaymentReconciliationQueue().add(QUEUE_NAME, data, {
    jobId: options?.jobId,
  });
}

/**
 * Boots the BullMQ worker that processes reconciliation jobs. Idempotent:
 * `createWorker` returns the cached instance on subsequent calls.
 */
export function startPaymentReconciliationQueueWorker() {
  return createWorker<PaymentReconciliationJobData>(
    QUEUE_NAME,
    async (job: Job<PaymentReconciliationJobData>) => {
      await runPaymentReconciliationJob(job.data ?? { trigger: 'cron' });
    },
    {
      // Reconciliation contacts external payment providers per tenant; keep
      // concurrency low so we don't fan-out provider rate limits.
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 1000,
      },
    },
  );
}

/**
 * Registers (or refreshes) the daily repeatable job. Safe to call on every
 * boot — BullMQ deduplicates by `{ name, repeat }`. We additionally remove
 * any previously registered repeatables under the same name so a cron-pattern
 * change in code propagates without manual Redis cleanup.
 */
export async function schedulePaymentReconciliationRepeatable(): Promise<void> {
  const queue = getPaymentReconciliationQueue();

  try {
    const existing = await queue.getRepeatableJobs();
    for (const job of existing) {
      if (job.name === PAYMENT_RECONCILIATION_REPEAT_JOB_NAME) {
        await queue.removeRepeatableByKey(job.key);
      }
    }
  } catch (err) {
    // Non-fatal — the add() below will still register the new repeatable.
    logger.warn(
      { err },
      '[PaymentReconciliationQueue] Failed to clean up existing repeatables',
    );
  }

  await queue.add(
    PAYMENT_RECONCILIATION_REPEAT_JOB_NAME,
    { trigger: 'cron' },
    {
      repeat: { pattern: DAILY_AT_02_UTC_CRON, tz: 'UTC' },
      // The job is idempotent at the worker level (worker bails when no
      // tenants need reconciliation), so a single attempt + DLQ on failure
      // is preferred over silent retries that could double-call providers.
      attempts: 1,
    },
  );

  logger.info(
    { cron: DAILY_AT_02_UTC_CRON, tz: 'UTC' },
    '[PaymentReconciliationQueue] Daily repeatable scheduled',
  );
}

/**
 * Tears down the repeatable schedule. Used by graceful-shutdown paths and by
 * tests that want to assert the schedule is no longer registered.
 */
export async function unschedulePaymentReconciliationRepeatable(): Promise<void> {
  const queue = getPaymentReconciliationQueue();
  const existing = await queue.getRepeatableJobs();
  for (const job of existing) {
    if (job.name === PAYMENT_RECONCILIATION_REPEAT_JOB_NAME) {
      await queue.removeRepeatableByKey(job.key);
    }
  }
}
