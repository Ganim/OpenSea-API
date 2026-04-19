import { PrismaBoardAutomationsRepository } from '@/repositories/tasks/prisma/prisma-board-automations-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { DefaultModuleNotifier } from '@/use-cases/shared/helpers/default-module-notifier';
import {
  ExecuteAutomationUseCase,
  type TaskAutomationNotificationCategory,
} from '../execute-automation';

export function makeExecuteAutomationUseCase() {
  return new ExecuteAutomationUseCase(
    new PrismaBoardAutomationsRepository(),
    new PrismaCardsRepository(),
    new PrismaBoardColumnsRepository(),
    new PrismaCardActivitiesRepository(),
    new PrismaCardWatchersRepository(),
    new DefaultModuleNotifier<TaskAutomationNotificationCategory>(),
  );
}
