import { logger } from '@/lib/logger';
import { PaymentReconciliationWorker } from './payment-reconciliation.worker';

const LOG_PREFIX = '[PaymentReconciliationScheduler]';
const TICK_INTERVAL_MS = 60_000;
const TARGET_UTC_HOUR = 2;

let schedulerIntervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastRunDateKey: string | null = null;

function getDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runIfDue(): Promise<void> {
  if (isRunning) {
    return;
  }

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDateKey = getDateKey(now);

  if (currentHour !== TARGET_UTC_HOUR) {
    return;
  }

  if (lastRunDateKey === currentDateKey) {
    return;
  }

  isRunning = true;
  const startedAt = Date.now();

  try {
    const worker = new PaymentReconciliationWorker();
    await worker.execute();
    lastRunDateKey = currentDateKey;

    logger.info(
      {
        durationMs: Date.now() - startedAt,
        utcHour: TARGET_UTC_HOUR,
      },
      `${LOG_PREFIX} Daily reconciliation run completed`,
    );
  } catch (error) {
    logger.error(
      {
        error,
        durationMs: Date.now() - startedAt,
      },
      `${LOG_PREFIX} Daily reconciliation run failed`,
    );
  } finally {
    isRunning = false;
  }
}

export async function startPaymentReconciliationScheduler(): Promise<void> {
  if (schedulerIntervalId) {
    logger.info(`${LOG_PREFIX} Already running`);
    return;
  }

  logger.info(
    { tickIntervalMs: TICK_INTERVAL_MS, targetUtcHour: TARGET_UTC_HOUR },
    `${LOG_PREFIX} Starting`,
  );

  await runIfDue();

  schedulerIntervalId = setInterval(() => {
    runIfDue().catch((error) => {
      logger.error({ error }, `${LOG_PREFIX} Tick failed`);
    });
  }, TICK_INTERVAL_MS);
}

export function stopPaymentReconciliationScheduler(): void {
  if (!schedulerIntervalId) {
    return;
  }

  clearInterval(schedulerIntervalId);
  schedulerIntervalId = null;
  logger.info(`${LOG_PREFIX} Stopped`);
}
