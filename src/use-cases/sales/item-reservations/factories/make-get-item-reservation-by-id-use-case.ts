import { PrismaItemReservationsRepository } from '@/repositories/sales/prisma/prisma-item-reservations-repository';
import { GetItemReservationByIdUseCase } from '../get-item-reservation-by-id';

export function makeGetItemReservationByIdUseCase() {
  const itemReservationsRepository = new PrismaItemReservationsRepository();
  return new GetItemReservationByIdUseCase(itemReservationsRepository);
}
