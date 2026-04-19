import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaOverdueActionsRepository } from '@/repositories/finance/prisma/prisma-overdue-actions-repository';
import { PrismaOverdueEscalationsRepository } from '@/repositories/finance/prisma/prisma-overdue-escalations-repository';
import { DefaultModuleNotifier } from '@/use-cases/shared/helpers/default-module-notifier';
import {
  ProcessOverdueEscalationsUseCase,
  type FinanceEscalationNotificationCategory,
} from '../process-overdue-escalations';
import { makeSendEscalationMessageUseCase } from './make-send-escalation-message-use-case';

export function makeProcessOverdueEscalationsUseCase() {
  return new ProcessOverdueEscalationsUseCase(
    new PrismaFinanceEntriesRepository(),
    new PrismaOverdueEscalationsRepository(),
    new PrismaOverdueActionsRepository(),
    new DefaultModuleNotifier<FinanceEscalationNotificationCategory>(),
    makeSendEscalationMessageUseCase(),
  );
}
