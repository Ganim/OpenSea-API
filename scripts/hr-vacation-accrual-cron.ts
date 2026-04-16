/**
 * Cron script: HR vacation accrual
 *
 * Iterates over every active tenant and runs the
 * {@link RunVacationAccrualUseCase}, opening a new acquisitive vacation period
 * whenever an active employee has just completed another 12-month anniversary
 * since the hire date.
 *
 * Idempotent: existing PENDING periods for the current acquisitive cycle are
 * skipped. Safe to re-run on the same day.
 *
 * Equivalent in-process scheduler: `src/workers/hr-vacation-accrual-scheduler.ts`
 * Cron expression target:           `0 2 1 * *` (every 1st day of month, 02:00 UTC)
 *
 * Usage:
 *   npm run cron:hr-vacation-accrual
 *   # or directly:
 *   npx tsx --env-file=.env scripts/hr-vacation-accrual-cron.ts
 *
 * Exit codes:
 *   0 — all tenants processed successfully (or no tenants found)
 *   1 — at least one tenant failed
 */

import { prisma } from '../src/lib/prisma';
import { makeRunVacationAccrualUseCase } from '../src/use-cases/hr/vacations/factories/make-run-vacation-accrual-use-case';

const LOG_PREFIX = '[hr-vacation-accrual-cron]';

async function main() {
  const startedAt = Date.now();
  console.log(`${LOG_PREFIX} Starting at ${new Date().toISOString()}`);

  const useCase = makeRunVacationAccrualUseCase();

  const activeTenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true },
  });

  console.log(`${LOG_PREFIX} Found ${activeTenants.length} active tenants`);

  let totalCreatedPeriods = 0;
  let totalSkippedPeriods = 0;
  let totalEvaluatedEmployees = 0;
  let failedTenants = 0;

  for (const tenant of activeTenants) {
    try {
      const result = await useCase.execute({ tenantId: tenant.id });

      totalCreatedPeriods += result.createdPeriods;
      totalSkippedPeriods += result.skippedPeriods;
      totalEvaluatedEmployees += result.evaluatedEmployees;

      if (result.createdPeriods > 0) {
        console.log(
          `${LOG_PREFIX} Tenant "${tenant.name}": ${result.createdPeriods} period(s) created, ${result.skippedPeriods} skipped (evaluated ${result.evaluatedEmployees})`,
        );
      }
    } catch (error) {
      failedTenants++;
      console.error(
        `${LOG_PREFIX} Error for tenant "${tenant.name}" (${tenant.id}):`,
        error,
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  console.log(`${LOG_PREFIX} Summary:`);
  console.log(`  Tenants processed: ${activeTenants.length}`);
  console.log(`  Failed tenants:    ${failedTenants}`);
  console.log(`  Created periods:   ${totalCreatedPeriods}`);
  console.log(`  Skipped periods:   ${totalSkippedPeriods}`);
  console.log(`  Evaluated employees: ${totalEvaluatedEmployees}`);
  console.log(`  Duration: ${durationMs}ms`);
  console.log(`${LOG_PREFIX} Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();

  process.exit(failedTenants > 0 ? 1 : 0);
}

main().catch(async (err) => {
  console.error(`${LOG_PREFIX} Fatal error:`, err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
