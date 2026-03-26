import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateCipaMandateController } from './v1-create-cipa-mandate.controller';
import { v1UpdateCipaMandateController } from './v1-update-cipa-mandate.controller';
import { v1DeleteCipaMandateController } from './v1-delete-cipa-mandate.controller';
import { v1GetCipaMandateController } from './v1-get-cipa-mandate.controller';
import { v1ListCipaMandatesController } from './v1-list-cipa-mandates.controller';

export async function cipaMandatesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateCipaMandateController);
      mutationApp.register(v1UpdateCipaMandateController);
      mutationApp.register(v1DeleteCipaMandateController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetCipaMandateController);
      queryApp.register(v1ListCipaMandatesController);
    },
    { prefix: '' },
  );
}
