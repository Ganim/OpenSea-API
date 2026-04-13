import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createWorkstationTypeController } from './v1-create-workstation-type.controller';
import { deleteWorkstationTypeController } from './v1-delete-workstation-type.controller';
import { getWorkstationTypeByIdController } from './v1-get-workstation-type-by-id.controller';
import { listWorkstationTypesController } from './v1-list-workstation-types.controller';
import { updateWorkstationTypeController } from './v1-update-workstation-type.controller';

export async function workstationTypesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('PRODUCTION'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteWorkstationTypeController);
    },
    { prefix: '' },
  );

  // Mutation routes com rate limit de mutação
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createWorkstationTypeController);
      mutationApp.register(updateWorkstationTypeController);
    },
    { prefix: '' },
  );

  // Query routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getWorkstationTypeByIdController);
      queryApp.register(listWorkstationTypesController);
    },
    { prefix: '' },
  );
}
