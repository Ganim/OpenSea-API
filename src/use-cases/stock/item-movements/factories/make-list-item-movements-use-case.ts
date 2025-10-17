import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { ListItemMovementsUseCase } from '../list-item-movements';

export function makeListItemMovementsUseCase() {
  const itemMovementsRepository = new PrismaItemMovementsRepository();
  return new ListItemMovementsUseCase(itemMovementsRepository);
}
