import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createTagController } from './v1-create-tag.controller';
import { deleteTagController } from './v1-delete-tag.controller';
import { getTagByIdController } from './v1-get-tag-by-id.controller';
import { listTagsController } from './v1-list-tags.controller';
import { updateTagController } from './v1-update-tag.controller';

export async function tagsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      await adminApp.register(deleteTagController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      await managerApp.register(createTagController);
      await managerApp.register(updateTagController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await queryApp.register(listTagsController);
      await queryApp.register(getTagByIdController);
    },
    { prefix: '' },
  );
}
