import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateWarningController } from './v1-create-warning.controller';
import { v1GetWarningController } from './v1-get-warning.controller';
import { v1ListWarningsController } from './v1-list-warnings.controller';
import { v1UpdateWarningController } from './v1-update-warning.controller';
import { v1DeleteWarningController } from './v1-delete-warning.controller';
import { v1RevokeWarningController } from './v1-revoke-warning.controller';
import { v1AcknowledgeWarningController } from './v1-acknowledge-warning.controller';

export async function warningsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateWarningController);
      mutationApp.register(v1UpdateWarningController);
      mutationApp.register(v1DeleteWarningController);
      mutationApp.register(v1RevokeWarningController);
      mutationApp.register(v1AcknowledgeWarningController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetWarningController);
      queryApp.register(v1ListWarningsController);
    },
    { prefix: '' },
  );
}
