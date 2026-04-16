import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { makeGenerateMonthlyPayrollDraftUseCase } from '@/use-cases/hr/payrolls/factories/make-generate-monthly-payroll-draft-use-case';

const LOG_PREFIX = '[HrPayrollGenerationScheduler]';
const TICK_INTERVAL_MS = 60_000;

// Cron equivalent: "0 3 25 * *" — every 25th day of the month at 03:00 UTC.
const TARGET_DAY_OF_MONTH = 25;
const TARGET_UTC_HOUR = 3;

let schedulerIntervalId: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastRunMonthKey: string | null = null;

function getMonthKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  const useCase = makeGenerateMonthlyPayrollDraftUseCase();

  let totalCreated = 0;
  let totalAlreadyExisted = 0;
  let totalEmptyTenants = 0;
  let failedTenants = 0;

  for (const tenantId of tenantIds) {
    try {
      const result = await useCase.execute({ tenantId });

      if (!result.payroll) {
        totalEmptyTenants++;
        continue;
      }

      if (result.alreadyExisted) {
        totalAlreadyExisted++;
        continue;
      }

      totalCreated++;
      logger.info(
        {
          tenantId,
          payrollId: result.payroll.id.toString(),
          referenceMonth: result.referenceMonth,
          referenceYear: result.referenceYear,
          evaluatedEmployees: result.evaluatedEmployees,
        },
        `${LOG_PREFIX} Draft payroll created for tenant`,
      );
    } catch (error) {
      failedTenants++;
      logger.error(
        { error, tenantId },
        `${LOG_PREFIX} Failed to generate draft payroll for tenant`,
      );
    }
  }

  logger.info(
    {
      tenantsProcessed: tenantIds.length,
      failedTenants,
      totalCreated,
      totalAlreadyExisted,
      totalEmptyTenants,
    },
    `${LOG_PREFIX} Monthly draft payroll cycle finished`,
  );
}

async function runIfDue(): Promise<void> {
  if (isRunning) return;

  const now = new Date();

  if (now.getUTCDate() !== TARGET_DAY_OF_MONTH) return;
  if (now.getUTCHours() !== TARGET_UTC_HOUR) return;

  const monthKey = getMonthKey(now);
  if (lastRunMonthKey === monthKey) return;

  isRunning = true;
  const startedAt = Date.now();

  try {
    await processAllTenants();
    lastRunMonthKey = monthKey;
    logger.info(
      { durationMs: Date.now() - startedAt, monthKey },
      `${LOG_PREFIX} Monthly run completed`,
    );
  } catch (error) {
    logger.error(
      { error, durationMs: Date.now() - startedAt },
      `${LOG_PREFIX} Monthly run failed`,
    );
  } finally {
    isRunning = false;
  }
}

export async function startHrPayrollGenerationScheduler(): Promise<void> {
  if (schedulerIntervalId) {
    logger.info(`${LOG_PREFIX} Already running`);
    return;
  }

  logger.info(
    {
      tickIntervalMs: TICK_INTERVAL_MS,
      targetDayOfMonth: TARGET_DAY_OF_MONTH,
      targetUtcHour: TARGET_UTC_HOUR,
    },
    `${LOG_PREFIX} Starting`,
  );

  await runIfDue();

  schedulerIntervalId = setInterval(() => {
    runIfDue().catch((error) => {
      logger.error({ error }, `${LOG_PREFIX} Tick failed`);
    });
  }, TICK_INTERVAL_MS);
}

export function stopHrPayrollGenerationScheduler(): void {
  if (!schedulerIntervalId) return;

  clearInterval(schedulerIntervalId);
  schedulerIntervalId = null;
  logger.info(`${LOG_PREFIX} Stopped`);
}
