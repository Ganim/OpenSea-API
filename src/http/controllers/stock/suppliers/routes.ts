import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';

import { createSupplierController } from './v1-create-supplier.controller';
import { deleteSupplierController } from './v1-delete-supplier.controller';
import { getSupplierByIdController } from './v1-get-supplier-by-id.controller';
import { listSuppliersController } from './v1-list-suppliers.controller';
import { updateSupplierController } from './v1-update-supplier.controller';

export async function suppliersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteSupplierController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createSupplierController);
      managerApp.register(updateSupplierController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getSupplierByIdController);
      queryApp.register(listSuppliersController);
    },
    { prefix: '' },
  );
}
