import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createDowntimeReasonController } from './v1-create-downtime-reason.controller';
import { deleteDowntimeReasonController } from './v1-delete-downtime-reason.controller';
import { listDowntimeReasonsController } from './v1-list-downtime-reasons.controller';
import { updateDowntimeReasonController } from './v1-update-downtime-reason.controller';

export async function downtimeReasonsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteDowntimeReasonController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createDowntimeReasonController);
      mutationApp.register(updateDowntimeReasonController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listDowntimeReasonsController);
    },
    { prefix: '' },
  );
}
