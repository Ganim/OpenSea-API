import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { makeNotifyDocExpiryUseCase } from '@/use-cases/hr/notifications/factories/make-notify-doc-expiry-use-case';

const LOG_PREFIX = '[HrDocExpiryScheduler]';
const TICK_INTERVAL_MS = 60_000;

// Cron equivalent: "0 8 * * *" — every day at 08:00 UTC.
const TARGET_UTC_HOUR = 8;

let schedulerIntervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastRunDateKey: string | null = null;

function getDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function listActiveTenantIds(): Promise<string[]> {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });

  return tenants.map((tenant) => tenant.id);
}

async function processAllTenants(): Promise<void> {
  const tenantIds = await listActiveTenantIds();
  const useCase = makeNotifyDocExpiryUseCase();

  let totalNotifications = 0;
  let totalMedicalExams = 0;
  let totalTrainings = 0;
  let failedTenants = 0;

  for (const tenantId of tenantIds) {
    try {
      const result = await useCase.execute({ tenantId });
      totalNotifications += result.notificationsCreated;
      totalMedicalExams += result.scannedMedicalExams;
      totalTrainings += result.scannedTrainings;

      if (result.notificationsCreated > 0) {
        logger.info(
          {
            tenantId,
            notificationsCreated: result.notificationsCreated,
            scannedMedicalExams: result.scannedMedicalExams,
            scannedTrainings: result.scannedTrainings,
          },
          `${LOG_PREFIX} Document expiry notifications dispatched for tenant`,
        );
      }
    } catch (error) {
      failedTenants++;
      logger.error(
        { error, tenantId },
        `${LOG_PREFIX} Failed to process document expiry for tenant`,
      );
    }
  }

  logger.info(
    {
      tenantsProcessed: tenantIds.length,
      failedTenants,
      totalNotifications,
      totalMedicalExams,
      totalTrainings,
    },
    `${LOG_PREFIX} Daily document expiry cycle finished`,
  );
}

async function runIfDue(): Promise<void> {
  if (isRunning) return;

  const now = new Date();

  if (now.getUTCHours() !== TARGET_UTC_HOUR) return;

  const dateKey = getDateKey(now);
  if (lastRunDateKey === dateKey) return;

  isRunning = true;
  const startedAt = Date.now();

  try {
    await processAllTenants();
    lastRunDateKey = dateKey;
    logger.info(
      { durationMs: Date.now() - startedAt, dateKey },
      `${LOG_PREFIX} Daily run completed`,
    );
  } catch (error) {
    logger.error(
      { error, durationMs: Date.now() - startedAt },
      `${LOG_PREFIX} Daily run failed`,
    );
  } finally {
    isRunning = false;
  }
}

export async function startHrDocExpiryScheduler(): Promise<void> {
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

export function stopHrDocExpiryScheduler(): void {
  if (!schedulerIntervalId) return;

  clearInterval(schedulerIntervalId);
  schedulerIntervalId = null;
  logger.info(`${LOG_PREFIX} Stopped`);
}
