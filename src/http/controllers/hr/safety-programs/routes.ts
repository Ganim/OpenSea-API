import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateSafetyProgramController } from './v1-create-safety-program.controller';
import { v1UpdateSafetyProgramController } from './v1-update-safety-program.controller';
import { v1DeleteSafetyProgramController } from './v1-delete-safety-program.controller';
import { v1GetSafetyProgramController } from './v1-get-safety-program.controller';
import { v1ListSafetyProgramsController } from './v1-list-safety-programs.controller';

export async function safetyProgramsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateSafetyProgramController);
      mutationApp.register(v1UpdateSafetyProgramController);
      mutationApp.register(v1DeleteSafetyProgramController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetSafetyProgramController);
      queryApp.register(v1ListSafetyProgramsController);
    },
    { prefix: '' },
  );
}
