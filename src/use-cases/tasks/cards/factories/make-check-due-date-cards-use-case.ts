import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { DefaultModuleNotifier } from '@/use-cases/shared/helpers/default-module-notifier';
import {
  CheckDueDateCardsUseCase,
  type TaskDueDateNotificationCategory,
} from '../check-due-date-cards';

export function makeCheckDueDateCardsUseCase() {
  return new CheckDueDateCardsUseCase(
    new PrismaCardsRepository(),
    new DefaultModuleNotifier<TaskDueDateNotificationCategory>(),
  );
}
