import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createShareLinkController } from './v1-create-share-link.controller';
import { listShareLinksController } from './v1-list-share-links.controller';
import { revokeShareLinkController } from './v1-revoke-share-link.controller';

export async function storageSharingRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STORAGE'));

  // Mutation routes (create, revoke)
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createShareLinkController);
      mutationApp.register(revokeShareLinkController);
    },
    { prefix: '' },
  );

  // Query routes (list)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listShareLinksController);
    },
    { prefix: '' },
  );
}
