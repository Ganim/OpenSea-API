import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { approveBomController } from './v1-approve-bom.controller';
import { createBomController } from './v1-create-bom.controller';
import { deleteBomController } from './v1-delete-bom.controller';
import { getBomByIdController } from './v1-get-bom-by-id.controller';
import { listBomsController } from './v1-list-boms.controller';
import { updateBomController } from './v1-update-bom.controller';

export async function bomsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteBomController);
      adminApp.register(approveBomController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createBomController);
      mutationApp.register(updateBomController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getBomByIdController);
      queryApp.register(listBomsController);
    },
    { prefix: '' },
  );
}
