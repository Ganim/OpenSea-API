import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { ListItemsByProductIdUseCase } from '../list-items-by-product-id';

export function makeListItemsByProductIdUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const listItemsByProductIdUseCase = new ListItemsByProductIdUseCase(
    itemsRepository,
  );

  return listItemsByProductIdUseCase;
}