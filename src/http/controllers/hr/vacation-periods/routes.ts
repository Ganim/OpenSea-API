import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { cancelScheduledVacationController } from './v1-cancel-scheduled-vacation.controller';
import { completeVacationController } from './v1-complete-vacation.controller';
import { createVacationPeriodController } from './v1-create-vacation-period.controller';
import { getVacationPeriodController } from './v1-get-vacation-period.controller';
import { listVacationPeriodsController } from './v1-list-vacation-periods.controller';
import { scheduleVacationController } from './v1-schedule-vacation.controller';
import { sellVacationDaysController } from './v1-sell-vacation-days.controller';
import { startVacationController } from './v1-start-vacation.controller';

export async function vacationPeriodsRoutes() {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createVacationPeriodController);
      mutationApp.register(scheduleVacationController);
      mutationApp.register(cancelScheduledVacationController);
      mutationApp.register(startVacationController);
      mutationApp.register(completeVacationController);
      mutationApp.register(sellVacationDaysController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getVacationPeriodController);
      queryApp.register(listVacationPeriodsController);
    },
    { prefix: '' },
  );
}
