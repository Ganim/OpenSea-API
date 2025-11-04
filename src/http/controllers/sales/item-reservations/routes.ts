import type { FastifyInstance } from 'fastify';
import { createItemReservationController } from './v1-create-item-reservation.controller';
import { getItemReservationByIdController } from './v1-get-item-reservation-by-id.controller';
import { listItemReservationsController } from './v1-list-item-reservations.controller';
import { releaseItemReservationController } from './v1-release-item-reservation.controller';

export async function itemReservationsRoutes(app: FastifyInstance) {
  await app.register(getItemReservationByIdController);
  await app.register(listItemReservationsController);
  await app.register(createItemReservationController);
  await app.register(releaseItemReservationController);
}
