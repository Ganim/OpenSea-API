import type { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';

import { createSupplierController } from './v1-create-supplier.controller';
import { deleteSupplierController } from './v1-delete-supplier.controller';
import { getSupplierByIdController } from './v1-get-supplier-by-id.controller';
import { listSuppliersController } from './v1-list-suppliers.controller';
import { updateSupplierController } from './v1-update-supplier.controller';

export async function suppliersRoutes(app: FastifyInstance) {
  // Authenticated routes (any authenticated user)
  app.register(getSupplierByIdController, { onRequest: [verifyJwt] });
  app.register(listSuppliersController, { onRequest: [verifyJwt] });

  // Manager routes (require MANAGER role)
  app.register(createSupplierController, {
    onRequest: [verifyJwt, verifyUserManager],
  });
  app.register(updateSupplierController, {
    onRequest: [verifyJwt, verifyUserManager],
  });
  app.register(deleteSupplierController, {
    onRequest: [verifyJwt, verifyUserManager],
  });
}
