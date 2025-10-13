import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { ListItemsUseCase } from '../list-items';

export function makeListItemsUseCase() {
  const itemsRepository = new PrismaItemsRepository();

  return new ListItemsUseCase(itemsRepository);
}
