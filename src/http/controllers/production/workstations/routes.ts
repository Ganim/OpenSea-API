import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createWorkstationController } from './v1-create-workstation.controller';
import { deleteWorkstationController } from './v1-delete-workstation.controller';
import { getWorkstationByIdController } from './v1-get-workstation-by-id.controller';
import { listWorkstationsController } from './v1-list-workstations.controller';
import { updateWorkstationController } from './v1-update-workstation.controller';

export async function workstationsRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteWorkstationController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createWorkstationController);
      mutationApp.register(updateWorkstationController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getWorkstationByIdController);
      queryApp.register(listWorkstationsController);
    },
    { prefix: '' },
  );
}
