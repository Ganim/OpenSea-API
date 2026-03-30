import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateDependantController } from './v1-create-dependant.controller';
import { v1UpdateDependantController } from './v1-update-dependant.controller';
import { v1DeleteDependantController } from './v1-delete-dependant.controller';
import { v1GetDependantController } from './v1-get-dependant.controller';
import { v1ListDependantsController } from './v1-list-dependants.controller';

export async function dependantsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateDependantController);
      mutationApp.register(v1UpdateDependantController);
      mutationApp.register(v1DeleteDependantController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetDependantController);
      queryApp.register(v1ListDependantsController);
    },
    { prefix: '' },
  );
}
