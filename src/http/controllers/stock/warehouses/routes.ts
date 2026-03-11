import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { rateLimitConfig } from '@/config/rate-limits';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createWarehouseController } from './v1-create-warehouse.controller';
import { updateWarehouseController } from './v1-update-warehouse.controller';
import { deleteWarehouseController } from './v1-delete-warehouse.controller';
import { getWarehouseByIdController } from './v1-get-warehouse-by-id.controller';
import { listWarehousesController } from './v1-list-warehouses.controller';

export async function warehousesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      await deleteWarehouseController(adminApp);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      await createWarehouseController(managerApp);
      await updateWarehouseController(managerApp);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      await getWarehouseByIdController(queryApp);
      await listWarehousesController(queryApp);
    },
    { prefix: '' },
  );
}
