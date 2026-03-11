/**
 * Cron script: Expire overdue vacation periods
 *
 * Runs daily to mark vacation periods as EXPIRED when
 * the concession period has ended without the employee using their days.
 *
 * Usage:
 *   npx tsx scripts/expire-vacations-cron.ts
 *
 * Fly.io Machine schedule: daily at 06:00 UTC
 */

import { prisma } from '../src/lib/prisma';
import { PrismaVacationPeriodsRepository } from '../src/repositories/hr/prisma/prisma-vacation-periods-repository';
import { ExpireVacationPeriodsUseCase } from '../src/use-cases/hr/vacation-periods/expire-vacation-periods';

async function main() {
  console.log(`[expire-vacations] Starting at ${new Date().toISOString()}`);

  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const useCase = new ExpireVacationPeriodsUseCase(vacationPeriodsRepository);

  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  console.log(`[expire-vacations] Found ${tenants.length} active tenants`);

  let totalExpired = 0;

  for (const tenant of tenants) {
    try {
      const result = await useCase.execute({ tenantId: tenant.id });

      totalExpired += result.expiredCount;

      if (result.expiredCount > 0) {
        console.log(
          `[expire-vacations] Tenant "${tenant.name}": ${result.expiredCount} periods expired`,
        );
      }
    } catch (error) {
      console.error(
        `[expire-vacations] Error for tenant "${tenant.name}":`,
        error,
      );
    }
  }

  console.log(`[expire-vacations] Summary: ${totalExpired} periods expired`);
  console.log(`[expire-vacations] Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[expire-vacations] Fatal error:', err);
  process.exit(1);
});
