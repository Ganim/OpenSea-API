/**
 * Cron script: Check cards with approaching and reached due dates
 *
 * Runs hourly across all active tenants to:
 * 1. Find overdue cards (dueDate <= now) → OVERDUE notification
 * 2. Find cards due within 1 hour → DUE_1H notification
 * 3. Find cards due within 24 hours → DUE_24H notification
 *
 * Dispatch is idempotent per (category, card, level, user) — re-runs don't
 * duplicate notifications.
 *
 * Usage:
 *   npx tsx scripts/check-due-date-cards-cron.ts
 */

import { prisma } from '../src/lib/prisma';
import { PrismaCardsRepository } from '../src/repositories/tasks/prisma/prisma-cards-repository';
import { CheckDueDateCardsUseCase } from '../src/use-cases/tasks/cards/check-due-date-cards';
import { DefaultModuleNotifier } from '../src/use-cases/shared/helpers/default-module-notifier';
import type { TaskDueDateNotificationCategory } from '../src/use-cases/tasks/cards/check-due-date-cards';

async function main() {
  console.log(`[check-due-dates] Starting at ${new Date().toISOString()}`);

  const useCase = new CheckDueDateCardsUseCase(
    new PrismaCardsRepository(),
    new DefaultModuleNotifier<TaskDueDateNotificationCategory>(),
  );

  try {
    const tenants = await prisma.tenant.findMany({
      where: { deletedAt: null, status: 'ACTIVE' },
      select: { id: true },
    });

    let totalProcessed = 0;
    let totalNotified = 0;

    for (const tenant of tenants) {
      const result = await useCase.execute({ tenantId: tenant.id });
      totalProcessed += result.processed;
      totalNotified += result.notified;
    }

    console.log(`[check-due-dates] Summary:`);
    console.log(`  Tenants scanned: ${tenants.length}`);
    console.log(`  Cards processed: ${totalProcessed}`);
    console.log(`  Notifications sent: ${totalNotified}`);
  } catch (error) {
    console.error('[check-due-dates] Error:', error);
  }

  console.log(`[check-due-dates] Done at ${new Date().toISOString()}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[check-due-dates] Fatal error:', err);
  process.exit(1);
});
