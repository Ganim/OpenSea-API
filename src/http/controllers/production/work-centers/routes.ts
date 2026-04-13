import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createWorkCenterController } from './v1-create-work-center.controller';
import { deleteWorkCenterController } from './v1-delete-work-center.controller';
import { getWorkCenterByIdController } from './v1-get-work-center-by-id.controller';
import { listWorkCentersController } from './v1-list-work-centers.controller';
import { updateWorkCenterController } from './v1-update-work-center.controller';

export async function workCentersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteWorkCenterController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createWorkCenterController);
      mutationApp.register(updateWorkCenterController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getWorkCenterByIdController);
      queryApp.register(listWorkCentersController);
    },
    { prefix: '' },
  );
}
