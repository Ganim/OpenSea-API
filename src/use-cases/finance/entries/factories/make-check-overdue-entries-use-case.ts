import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { CheckOverdueEntriesUseCase } from '../check-overdue-entries';

export function makeCheckOverdueEntriesUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const notificationsRepository = new PrismaNotificationsRepository();

  return new CheckOverdueEntriesUseCase(
    entriesRepository,
    notificationsRepository,
  );
}
