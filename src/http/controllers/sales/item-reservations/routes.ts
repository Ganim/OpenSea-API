import { verifyJwt } from '@/http/middlewares/verify-jwt';
import type { FastifyInstance } from 'fastify';
import { v1CreateItemReservationController } from './v1-create-item-reservation.controller';
import { v1GetItemReservationByIdController } from './v1-get-item-reservation-by-id.controller';
import { v1ListItemReservationsController } from './v1-list-item-reservations.controller';
import { v1ReleaseItemReservationController } from './v1-release-item-reservation.controller';

export async function itemReservationsRoutes(app: FastifyInstance) {
  app.post(
    '/v1/item-reservations',
    {
      onRequest: [verifyJwt],
      schema: v1CreateItemReservationController.schema,
    },
    v1CreateItemReservationController,
  );

  app.get(
    '/v1/item-reservations/:id',
    {
      onRequest: [verifyJwt],
      schema: v1GetItemReservationByIdController.schema,
    },
    v1GetItemReservationByIdController,
  );

  app.get(
    '/v1/item-reservations',
    {
      onRequest: [verifyJwt],
      schema: v1ListItemReservationsController.schema,
    },
    v1ListItemReservationsController,
  );

  app.patch(
    '/v1/item-reservations/:id/release',
    {
      onRequest: [verifyJwt],
      schema: v1ReleaseItemReservationController.schema,
    },
    v1ReleaseItemReservationController,
  );
}
