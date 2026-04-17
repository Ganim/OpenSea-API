import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createTemplateController } from './v1-create-template.controller';
import { deleteTemplateController } from './v1-delete-template.controller';
import { listTemplatesController } from './v1-list-templates.controller';
import { updateTemplateController } from './v1-update-template.controller';

export async function signatureTemplatesRoutes(app: FastifyInstance) {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createTemplateController);
      mutationApp.register(updateTemplateController);
      mutationApp.register(deleteTemplateController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listTemplatesController);
    },
    { prefix: '' },
  );
}
