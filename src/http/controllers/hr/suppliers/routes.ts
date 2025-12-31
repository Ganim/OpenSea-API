import type { FastifyInstance } from 'fastify';
import { v1CreateSupplierController } from './v1-create-supplier.controller';
import { v1GetSupplierByIdController } from './v1-get-supplier-by-id.controller';
import { v1ListSuppliersController } from './v1-list-suppliers.controller';
import { v1UpdateSupplierController } from './v1-update-supplier.controller';
import { v1DeleteSupplierController } from './v1-delete-supplier.controller';

export async function suppliersRoutes(app: FastifyInstance) {
  await v1CreateSupplierController(app);
  await v1GetSupplierByIdController(app);
  await v1ListSuppliersController(app);
  await v1UpdateSupplierController(app);
  await v1DeleteSupplierController(app);
}
