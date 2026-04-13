import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { listInspectionResultsController } from './v1-list-inspection-results.controller';
import { createInspectionResultController } from './v1-create-inspection-result.controller';
import { updateInspectionResultStatusController } from './v1-update-inspection-result-status.controller';

export async function inspectionResultsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listInspectionResultsController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createInspectionResultController);
      mutationApp.register(updateInspectionResultStatusController);
    },
    { prefix: '' },
  );
}
