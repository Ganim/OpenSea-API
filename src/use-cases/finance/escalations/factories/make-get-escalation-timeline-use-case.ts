import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaOverdueActionsRepository } from '@/repositories/finance/prisma/prisma-overdue-actions-repository';
import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { GetEscalationTimelineUseCase } from '../get-escalation-timeline';

export function makeGetEscalationTimelineUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const actionsRepository = new PrismaOverdueActionsRepository();
  const escalationsRepository = new PrismaOverdueEscalationsRepository();
  return new GetEscalationTimelineUseCase(
    entriesRepository,
    actionsRepository,
    escalationsRepository,
  );
}
