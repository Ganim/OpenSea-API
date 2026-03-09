/**
 * Cron script: Check cards with reached due dates
 *
 * Runs daily to:
 * 1. Find active cards with dueDate <= now (not DONE, not CANCELED)
 * 2. Create IN_APP notifications for assignees and reporters
 *
 * Usage:
 *   npx tsx scripts/check-due-date-cards-cron.ts
 *
 * Fly.io Machine schedule: daily at 09:00 UTC
 */

import { prisma } from '../src/lib/prisma';
import { PrismaCardsRepository } from '../src/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaNotificationsRepository } from '../src/repositories/notifications/prisma/prisma-notifications-repository';
import { CheckDueDateCardsUseCase } from '../src/use-cases/tasks/cards/check-due-date-cards';

async function main() {
  console.log(`[check-due-dates] Starting at ${new Date().toISOString()}`);

  const cardsRepository = new PrismaCardsRepository();
  const notificationsRepository = new PrismaNotificationsRepository();
  const useCase = new CheckDueDateCardsUseCase(
    cardsRepository,
    notificationsRepository,
  );

  try {
    const result = await useCase.execute();

    console.log(`[check-due-dates] Summary:`);
    console.log(`  Cards processed: ${result.processed}`);
    console.log(`  Notifications sent: ${result.notified}`);
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
