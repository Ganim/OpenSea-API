import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaOverdueActionsRepository } from '@/repositories/finance/prisma/prisma-overdue-actions-repository';
import { GetEntryEscalationHistoryUseCase } from '../get-entry-escalation-history';

export function makeGetEntryEscalationHistoryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const actionsRepository = new PrismaOverdueActionsRepository();
  return new GetEntryEscalationHistoryUseCase(
    entriesRepository,
    actionsRepository,
  );
}
