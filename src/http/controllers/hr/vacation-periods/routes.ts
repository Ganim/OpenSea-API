import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CancelScheduledVacationController } from './v1-cancel-scheduled-vacation.controller';
import { v1CancelVacationSplitController } from './v1-cancel-vacation-split.controller';
import { v1CompleteAcquisitionController } from './v1-complete-acquisition.controller';
import { v1CompleteVacationController } from './v1-complete-vacation.controller';
import { v1CreateVacationPeriodController } from './v1-create-vacation-period.controller';
import { v1ExpireVacationPeriodsController } from './v1-expire-vacation-periods.controller';
import { v1GetVacationPeriodController } from './v1-get-vacation-period.controller';
import { v1ListVacationPeriodsController } from './v1-list-vacation-periods.controller';
import { v1ListVacationSplitsController } from './v1-list-vacation-splits.controller';
import { v1ScheduleCollectiveVacationController } from './v1-schedule-collective-vacation.controller';
import { v1ScheduleVacationController } from './v1-schedule-vacation.controller';
import { v1ScheduleVacationSplitController } from './v1-schedule-vacation-split.controller';
import { v1SellVacationDaysController } from './v1-sell-vacation-days.controller';
import { v1StartVacationController } from './v1-start-vacation.controller';

export async function vacationPeriodsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateVacationPeriodController);
      mutationApp.register(v1ScheduleVacationController);
      mutationApp.register(v1CancelScheduledVacationController);
      mutationApp.register(v1StartVacationController);
      mutationApp.register(v1CompleteVacationController);
      mutationApp.register(v1SellVacationDaysController);
      mutationApp.register(v1CompleteAcquisitionController);
      mutationApp.register(v1ExpireVacationPeriodsController);
      mutationApp.register(v1ScheduleVacationSplitController);
      mutationApp.register(v1CancelVacationSplitController);
      mutationApp.register(v1ScheduleCollectiveVacationController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetVacationPeriodController);
      queryApp.register(v1ListVacationPeriodsController);
      queryApp.register(v1ListVacationSplitsController);
    },
    { prefix: '' },
  );
}
