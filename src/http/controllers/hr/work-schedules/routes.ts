import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createWorkScheduleController } from './v1-create-work-schedule.controller';
import { deleteWorkScheduleController } from './v1-delete-work-schedule.controller';
import { getWorkScheduleController } from './v1-get-work-schedule.controller';
import { listWorkSchedulesController } from './v1-list-work-schedules.controller';
import { updateWorkScheduleController } from './v1-update-work-schedule.controller';

export async function workSchedulesRoutes() {
  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createWorkScheduleController);
      managerApp.register(updateWorkScheduleController);
      managerApp.register(deleteWorkScheduleController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getWorkScheduleController);
      queryApp.register(listWorkSchedulesController);
    },
    { prefix: '' },
  );
}
