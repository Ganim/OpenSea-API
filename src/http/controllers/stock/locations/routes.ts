import type { FastifyInstance } from 'fastify';

import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';

import { v1CreateLocationController } from './v1-create-location.controller';
import { v1DeleteLocationController } from './v1-delete-location.controller';
import { v1GetLocationByIdController } from './v1-get-location-by-id.controller';
import { v1ListLocationsController } from './v1-list-locations.controller';
import { v1UpdateLocationController } from './v1-update-location.controller';

export async function locationsRoutes(app: FastifyInstance) {
  // Manager routes (require MANAGER role)
  app.post(
    '/v1/locations',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1CreateLocationController.schema,
    },
    v1CreateLocationController,
  );

  app.put(
    '/v1/locations/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1UpdateLocationController.schema,
    },
    v1UpdateLocationController,
  );

  app.delete(
    '/v1/locations/:id',
    {
      onRequest: [verifyJwt, verifyUserManager],
      schema: v1DeleteLocationController.schema,
    },
    v1DeleteLocationController,
  );

  // Authenticated routes (require authentication only)
  app.get(
    '/v1/locations/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetLocationByIdController.schema,
    },
    v1GetLocationByIdController,
  );

  app.get(
    '/v1/locations',
    {
      onRequest: [verifyJwt],
      schema: v1ListLocationsController.schema,
    },
    v1ListLocationsController,
  );
}
