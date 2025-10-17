import { PrismaItemReservationsRepository } from '@/repositories/sales/prisma/prisma-item-reservations-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { CreateItemReservationUseCase } from '../create-item-reservation';

export function makeCreateItemReservationUseCase() {
  const itemReservationsRepository = new PrismaItemReservationsRepository();
  const itemsRepository = new PrismaItemsRepository();

  return new CreateItemReservationUseCase(
    itemReservationsRepository,
    itemsRepository,
  );
}
