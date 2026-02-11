/**
 * Cron script: Check overdue finance entries
 *
 * Runs daily to:
 * 1. Mark PENDING entries past due date as OVERDUE
 * 2. Create notifications for overdue entries (payable and receivable)
 * 3. Create due-soon alerts for entries due within 3 days
 *
 * Usage:
 *   npx tsx scripts/check-overdue-cron.ts
 *
 * Fly.io Machine schedule: daily at 08:00 UTC
 */

import { prisma } from '../src/lib/prisma';
import { PrismaFinanceEntriesRepository } from '../src/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaNotificationsRepository } from '../src/repositories/notifications/prisma/prisma-notifications-repository';
import { CheckOverdueEntriesUseCase } from '../src/use-cases/finance/entries/check-overdue-entries';

async function main() {
  console.log(`[check-overdue] Starting at ${new Date().toISOString()}`);

  const entriesRepository = new PrismaFinanceEntriesRepository();
  const notificationsRepository = new PrismaNotificationsRepository();
  const useCase = new CheckOverdueEntriesUseCase(
    entriesRepository,
    notificationsRepository,
  );

  // Fetch all active tenants
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  console.log(`[check-overdue] Found ${tenants.length} active tenants`);

  let totalMarkedOverdue = 0;
  let totalPayableOverdue = 0;
  let totalReceivableOverdue = 0;
  let totalDueSoonAlerts = 0;

  for (const tenant of tenants) {
    try {
      const result = await useCase.execute({
        tenantId: tenant.id,
        // No createdBy in cron context - notifications skipped
        // In production, could fetch finance managers per tenant
      });

      totalMarkedOverdue += result.markedOverdue;
      totalPayableOverdue += result.payableOverdue;
      totalReceivableOverdue += result.receivableOverdue;
      totalDueSoonAlerts += result.dueSoonAlerts;

      if (result.markedOverdue > 0 || result.dueSoonAlerts > 0) {
        console.log(
          `[check-overdue] Tenant "${tenant.name}": ${result.markedOverdue} overdue (${result.payableOverdue}P/${result.receivableOverdue}R), ${result.dueSoonAlerts} due-soon`,
        );
      }
    } catch (error) {
      console.error(
        `[check-overdue] Error for tenant "${tenant.name}":`,
        error,
      );
    }
  }

  console.log(`[check-overdue] Summary:`);
  console.log(
    `  Marked overdue: ${totalMarkedOverdue} (${totalPayableOverdue}P/${totalReceivableOverdue}R)`,
  );
  console.log(`  Due-soon alerts: ${totalDueSoonAlerts}`);
  console.log(`[check-overdue] Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[check-overdue] Fatal error:', err);
  process.exit(1);
});
