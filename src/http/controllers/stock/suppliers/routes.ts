import type { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';

import { v1CreateSupplierController } from './v1-create-supplier.controller';
import { v1DeleteSupplierController } from './v1-delete-supplier.controller';
import { v1GetSupplierByIdController } from './v1-get-supplier-by-id.controller';
import { v1ListSuppliersController } from './v1-list-suppliers.controller';
import { v1UpdateSupplierController } from './v1-update-supplier.controller';

export async function suppliersRoutes(app: FastifyInstance) {
  // Manager routes (require MANAGER role)
  app.post(
    '/v1/suppliers',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1CreateSupplierController.schema,
    },
    v1CreateSupplierController,
  );

  app.put(
    '/v1/suppliers/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1UpdateSupplierController.schema,
    },
    v1UpdateSupplierController,
  );

  app.delete(
    '/v1/suppliers/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1DeleteSupplierController.schema,
    },
    v1DeleteSupplierController,
  );

  // Authenticated routes (any authenticated user)
  app.get(
    '/v1/suppliers/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetSupplierByIdController.schema,
    },
    v1GetSupplierByIdController,
  );

  app.get(
    '/v1/suppliers',
    {
      onRequest: [verifyJwt],
      schema: v1ListSuppliersController.schema,
    },
    v1ListSuppliersController,
  );
}
