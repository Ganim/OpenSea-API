import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { DefaultModuleNotifier } from '@/use-cases/shared/helpers/default-module-notifier';
import {
  CheckOverdueEntriesUseCase,
  type FinanceEntryNotificationCategory,
} from '../check-overdue-entries';

export function makeCheckOverdueEntriesUseCase() {
  return new CheckOverdueEntriesUseCase(
    new PrismaFinanceEntriesRepository(),
    new DefaultModuleNotifier<FinanceEntryNotificationCategory>(),
  );
}
