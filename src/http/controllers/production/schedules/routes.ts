import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listSchedulesController } from './v1-list-schedules.controller';
import { getScheduleByIdController } from './v1-get-schedule-by-id.controller';
import { createScheduleController } from './v1-create-schedule.controller';
import { deleteScheduleController } from './v1-delete-schedule.controller';
import { createScheduleEntryController } from './v1-create-schedule-entry.controller';
import { updateScheduleEntryController } from './v1-update-schedule-entry.controller';
import { deleteScheduleEntryController } from './v1-delete-schedule-entry.controller';
import { listScheduleEntriesController } from './v1-list-schedule-entries.controller';

export async function productionSchedulesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listSchedulesController);
      queryApp.register(getScheduleByIdController);
      queryApp.register(listScheduleEntriesController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutacao
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createScheduleController);
      mutationApp.register(createScheduleEntryController);
      mutationApp.register(updateScheduleEntryController);
    },
    { prefix: '' },
  );

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteScheduleController);
      adminApp.register(deleteScheduleEntryController);
    },
    { prefix: '' },
  );
}
