import { PrismaItemReservationsRepository } from '@/repositories/sales/prisma/prisma-item-reservations-repository';
import { ListItemReservationsUseCase } from '../list-item-reservations';

export function makeListItemReservationsUseCase() {
  const itemReservationsRepository = new PrismaItemReservationsRepository();
  return new ListItemReservationsUseCase(itemReservationsRepository);
}
