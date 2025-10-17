import { PrismaItemReservationsRepository } from '@/repositories/sales/prisma/prisma-item-reservations-repository';
import { ReleaseItemReservationUseCase } from '../release-item-reservation';

export function makeReleaseItemReservationUseCase() {
  const itemReservationsRepository = new PrismaItemReservationsRepository();
  return new ReleaseItemReservationUseCase(itemReservationsRepository);
}
