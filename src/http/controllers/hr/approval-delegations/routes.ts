import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateDelegationController } from './v1-create-delegation.controller';
import { v1ListMyDelegationsController } from './v1-list-my-delegations.controller';
import { v1ListDelegationsToMeController } from './v1-list-delegations-to-me.controller';
import { v1RevokeDelegationController } from './v1-revoke-delegation.controller';
import { v1GetActiveDelegationsController } from './v1-get-active-delegations.controller';

export async function approvalDelegationsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateDelegationController);
      mutationApp.register(v1RevokeDelegationController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListMyDelegationsController);
      queryApp.register(v1ListDelegationsToMeController);
      queryApp.register(v1GetActiveDelegationsController);
    },
    { prefix: '' },
  );
}
