import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { createManufacturerController } from './v1-create-manufacturer.controller';
import { deleteManufacturerController } from './v1-delete-manufacturer.controller';
import { getManufacturerByIdController } from './v1-get-manufacturer-by-id.controller';
import { listManufacturersController } from './v1-list-manufacturers.controller';
import { updateManufacturerController } from './v1-update-manufacturer.controller';

export async function manufacturersRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('STOCK'));

  // Manager routes
  app.register(createManufacturerController);
  app.register(updateManufacturerController);
  app.register(deleteManufacturerController);

  // Authenticated routes
  app.register(getManufacturerByIdController);
  app.register(listManufacturersController);
}
