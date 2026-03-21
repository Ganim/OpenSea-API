import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createContentController } from './v1-create-content.controller';
import { listContentsController } from './v1-list-contents.controller';
import { getContentByIdController } from './v1-get-content-by-id.controller';
import { deleteContentController } from './v1-delete-content.controller';
import { approveContentController } from './v1-approve-content.controller';

export async function contentRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('SALES'));

  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteContentController);
      adminApp.register(approveContentController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createContentController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listContentsController);
      queryApp.register(getContentByIdController);
    },
    { prefix: '' },
  );
}
