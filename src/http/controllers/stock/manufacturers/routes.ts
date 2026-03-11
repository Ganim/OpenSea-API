import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createManufacturerController } from './v1-create-manufacturer.controller';
import { deleteManufacturerController } from './v1-delete-manufacturer.controller';
import { getManufacturerByIdController } from './v1-get-manufacturer-by-id.controller';
import { listManufacturersController } from './v1-list-manufacturers.controller';
import { updateManufacturerController } from './v1-update-manufacturer.controller';

export async function manufacturersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteManufacturerController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createManufacturerController);
      managerApp.register(updateManufacturerController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getManufacturerByIdController);
      queryApp.register(listManufacturersController);
    },
    { prefix: '' },
  );
}
