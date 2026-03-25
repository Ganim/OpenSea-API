import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaOverdueActionsRepository } from '@/repositories/finance/prisma/prisma-overdue-actions-repository';
import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { PrismaNotificationsRepository } from '@/repositories/notifications/prisma/prisma-notifications-repository';
import { ProcessOverdueEscalationsUseCase } from '../process-overdue-escalations';

export function makeProcessOverdueEscalationsUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  const actionsRepository = new PrismaOverdueActionsRepository();
  const notificationsRepository = new PrismaNotificationsRepository();

  return new ProcessOverdueEscalationsUseCase(
    entriesRepository,
    escalationsRepository,
    actionsRepository,
    notificationsRepository,
  );
}
