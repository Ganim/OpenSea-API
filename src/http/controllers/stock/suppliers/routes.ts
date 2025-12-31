import type { FastifyInstance } from 'fastify';

import { createSupplierController } from './v1-create-supplier.controller';
import { deleteSupplierController } from './v1-delete-supplier.controller';
import { getSupplierByIdController } from './v1-get-supplier-by-id.controller';
import { listSuppliersController } from './v1-list-suppliers.controller';
import { updateSupplierController } from './v1-update-supplier.controller';

export async function suppliersRoutes(app: FastifyInstance) {
  // All routes now use RBAC permission middleware configured in individual controllers
  app.register(getSupplierByIdController);
  app.register(listSuppliersController);
  app.register(createSupplierController);
  app.register(updateSupplierController);
  app.register(deleteSupplierController);
}
