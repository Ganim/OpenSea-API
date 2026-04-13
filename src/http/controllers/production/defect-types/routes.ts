import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createDefectTypeController } from './v1-create-defect-type.controller';
import { deleteDefectTypeController } from './v1-delete-defect-type.controller';
import { listDefectTypesController } from './v1-list-defect-types.controller';
import { updateDefectTypeController } from './v1-update-defect-type.controller';

export async function defectTypesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteDefectTypeController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createDefectTypeController);
      mutationApp.register(updateDefectTypeController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listDefectTypesController);
    },
    { prefix: '' },
  );
}
