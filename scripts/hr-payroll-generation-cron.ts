/**
 * Cron script: HR monthly payroll draft generation
 *
 * Iterates over every active tenant and runs the
 * {@link GenerateMonthlyPayrollDraftUseCase}, creating an empty draft Payroll
 * for the current month/year when none exists yet. The actual line-item
 * calculation is owned by the dedicated CalculatePayrollUseCase, triggered
 * manually after this draft is reviewed.
 *
 * Idempotent: repeated runs in the same month return the existing payroll
 * without creating duplicates.
 *
 * Equivalent in-process scheduler: `src/workers/hr-payroll-generation-scheduler.ts`
 * Cron expression target:           `0 3 25 * *` (every 25th day of month, 03:00 UTC)
 *
 * Usage:
 *   npm run cron:hr-payroll-generation
 *   # or directly:
 *   npx tsx --env-file=.env scripts/hr-payroll-generation-cron.ts
 *
 * Exit codes:
 *   0 — all tenants processed successfully (or no tenants found)
 *   1 — at least one tenant failed
 */

import { prisma } from '../src/lib/prisma';
import { makeGenerateMonthlyPayrollDraftUseCase } from '../src/use-cases/hr/payrolls/factories/make-generate-monthly-payroll-draft-use-case';

const LOG_PREFIX = '[hr-payroll-generation-cron]';

async function main() {
  const startedAt = Date.now();
  console.log(`${LOG_PREFIX} Starting at ${new Date().toISOString()}`);

  const useCase = makeGenerateMonthlyPayrollDraftUseCase();

  const activeTenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true, name: true },
  });

  console.log(`${LOG_PREFIX} Found ${activeTenants.length} active tenants`);

  let totalCreatedDrafts = 0;
  let totalAlreadyExisted = 0;
  let totalEmptyTenants = 0;
  let failedTenants = 0;

  for (const tenant of activeTenants) {
    try {
      const result = await useCase.execute({ tenantId: tenant.id });

      if (!result.payroll) {
        totalEmptyTenants++;
        continue;
      }

      if (result.alreadyExisted) {
        totalAlreadyExisted++;
        continue;
      }

      totalCreatedDrafts++;
      console.log(
        `${LOG_PREFIX} Tenant "${tenant.name}": draft created for ${String(result.referenceMonth).padStart(2, '0')}/${result.referenceYear} (payrollId=${result.payroll.id.toString()}, evaluated=${result.evaluatedEmployees})`,
      );
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
  console.log(`  Tenants processed:    ${activeTenants.length}`);
  console.log(`  Failed tenants:       ${failedTenants}`);
  console.log(`  Drafts created:       ${totalCreatedDrafts}`);
  console.log(`  Already existed:      ${totalAlreadyExisted}`);
  console.log(`  Tenants without employees: ${totalEmptyTenants}`);
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
