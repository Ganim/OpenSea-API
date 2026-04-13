import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createOperationRoutingController } from './v1-create-operation-routing.controller';
import { deleteOperationRoutingController } from './v1-delete-operation-routing.controller';
import { listOperationRoutingsController } from './v1-list-operation-routings.controller';
import { updateOperationRoutingController } from './v1-update-operation-routing.controller';

export async function operationRoutingsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteOperationRoutingController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createOperationRoutingController);
      mutationApp.register(updateOperationRoutingController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listOperationRoutingsController);
    },
    { prefix: '' },
  );
}
