import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createTemplateController } from './v1-create-template.controller';
import { deleteTemplateController } from './v1-delete-template.controller';
import { getTemplateByIdController } from './v1-get-template-by-id.controller';
import { listTemplatesController } from './v1-list-templates.controller';
import { updateTemplateController } from './v1-update-template.controller';

export async function templatesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      await adminApp.register(deleteTemplateController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      await managerApp.register(createTemplateController);
      await managerApp.register(updateTemplateController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await queryApp.register(getTemplateByIdController);
      await queryApp.register(listTemplatesController);
    },
    { prefix: '' },
  );
}
