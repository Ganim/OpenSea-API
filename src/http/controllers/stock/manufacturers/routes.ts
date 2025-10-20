import type { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';

import { v1CreateManufacturerController } from './v1-create-manufacturer.controller';
import { v1DeleteManufacturerController } from './v1-delete-manufacturer.controller';
import { v1GetManufacturerByIdController } from './v1-get-manufacturer-by-id.controller';
import { v1ListManufacturersController } from './v1-list-manufacturers.controller';
import { v1UpdateManufacturerController } from './v1-update-manufacturer.controller';

export async function manufacturersRoutes(app: FastifyInstance) {
  // Manager routes (require MANAGER role)
  app.post(
    '/v1/manufacturers',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1CreateManufacturerController.schema,
    },
    v1CreateManufacturerController,
  );

  app.put(
    '/v1/manufacturers/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1UpdateManufacturerController.schema,
    },
    v1UpdateManufacturerController,
  );

  app.delete(
    '/v1/manufacturers/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1DeleteManufacturerController.schema,
    },
    v1DeleteManufacturerController,
  );

  // Authenticated routes
  app.get(
    '/v1/manufacturers/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetManufacturerByIdController.schema,
    },
    v1GetManufacturerByIdController,
  );

  app.get(
    '/v1/manufacturers',
    {
      onRequest: [verifyJwt],
      schema: v1ListManufacturersController.schema,
    },
    v1ListManufacturersController,
  );
}
