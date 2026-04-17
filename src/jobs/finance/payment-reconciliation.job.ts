import { logger } from '@/lib/logger';
import { recordPaymentReconciliation } from '@/lib/telemetry/payment-reconciliation-telemetry';
import { PaymentReconciliationWorker } from '@/workers/payment-reconciliation.worker';

/**
 * BullMQ job payload for the payment-reconciliation scheduled run.
 *
 * The job is intentionally argument-less today — the worker discovers the
 * tenants that need reconciliation by querying the database. We still expose
 * an explicit payload type so that ad-hoc / on-demand runs can be triggered
 * from an admin endpoint later (e.g. `{ trigger: 'manual' }`) without a
 * breaking change.
 */
export interface PaymentReconciliationJobData {
  /** Identifies how the job was scheduled (cron tick, manual trigger, etc.). */
  trigger?: 'cron' | 'manual';
}

const LOG_PREFIX = '[PaymentReconciliationJob]';

/**
 * Factory hook so unit tests can inject a stubbed worker instead of relying on
 * the Prisma-backed default constructor. Production callers leave it untouched.
 */
export type PaymentReconciliationWorkerFactory = () => {
  execute: () => Promise<void>;
};

const defaultFactory: PaymentReconciliationWorkerFactory = () =>
  new PaymentReconciliationWorker();

/**
 * Runs one reconciliation pass. Wraps the existing in-process worker so the
 * BullMQ migration does NOT duplicate business logic — the worker is the single
 * source of truth for tenant discovery + per-tenant reconciliation.
 *
 * Errors are re-thrown so BullMQ retry/back-off + DLQ kick in. Telemetry is
 * recorded for both success and failure so dashboards stay accurate even when
 * the queue retries.
 */
export async function runPaymentReconciliationJob(
  data: PaymentReconciliationJobData = {},
  factory: PaymentReconciliationWorkerFactory = defaultFactory,
): Promise<void> {
  const startedAt = Date.now();
  const trigger = data.trigger ?? 'cron';

  logger.info({ trigger }, `${LOG_PREFIX} Starting reconciliation pass`);

  try {
    const worker = factory();
    await worker.execute();

    logger.info(
      { trigger, durationMs: Date.now() - startedAt },
      `${LOG_PREFIX} Reconciliation pass completed`,
    );
  } catch (error) {
    logger.error(
      { trigger, error, durationMs: Date.now() - startedAt },
      `${LOG_PREFIX} Reconciliation pass failed`,
    );

    // Record an aggregate failure so dashboards reflect the missed run.
    // Per-tenant telemetry is still emitted by the inner worker for partial
    // failures — this entry covers the catastrophic "did not even finish" case.
    recordPaymentReconciliation({
      tenantId: 'aggregate',
      processed: 0,
      confirmed: 0,
      failed: 0,
      expired: 0,
      duration: Date.now() - startedAt,
      success: false,
    });

    throw error;
  }
}
