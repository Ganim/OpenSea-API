import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateWorkplaceRiskController } from './v1-create-workplace-risk.controller';
import { v1UpdateWorkplaceRiskController } from './v1-update-workplace-risk.controller';
import { v1DeleteWorkplaceRiskController } from './v1-delete-workplace-risk.controller';
import { v1ListWorkplaceRisksController } from './v1-list-workplace-risks.controller';

export async function workplaceRisksRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateWorkplaceRiskController);
      mutationApp.register(v1UpdateWorkplaceRiskController);
      mutationApp.register(v1DeleteWorkplaceRiskController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListWorkplaceRisksController);
    },
    { prefix: '' },
  );
}
