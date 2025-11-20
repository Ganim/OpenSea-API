import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { ListItemsByVariantIdUseCase } from '../list-items-by-variant-id';

export function makeListItemsByVariantIdUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const listItemsByVariantIdUseCase = new ListItemsByVariantIdUseCase(
    itemsRepository,
  );

  return listItemsByVariantIdUseCase;
}