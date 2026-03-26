import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1AddCipaMemberController } from './v1-add-cipa-member.controller';
import { v1RemoveCipaMemberController } from './v1-remove-cipa-member.controller';
import { v1ListCipaMembersController } from './v1-list-cipa-members.controller';

export async function cipaMembersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1AddCipaMemberController);
      mutationApp.register(v1RemoveCipaMemberController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListCipaMembersController);
    },
    { prefix: '' },
  );
}
