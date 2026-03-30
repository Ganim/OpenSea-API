import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateWorkScheduleController } from './v1-create-work-schedule.controller';
import { v1DeleteWorkScheduleController } from './v1-delete-work-schedule.controller';
import { v1GetWorkScheduleController } from './v1-get-work-schedule.controller';
import { v1ListWorkSchedulesController } from './v1-list-work-schedules.controller';
import { v1UpdateWorkScheduleController } from './v1-update-work-schedule.controller';

export async function workSchedulesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(v1CreateWorkScheduleController);
      managerApp.register(v1UpdateWorkScheduleController);
      managerApp.register(v1DeleteWorkScheduleController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetWorkScheduleController);
      queryApp.register(v1ListWorkSchedulesController);
    },
    { prefix: '' },
  );
}
