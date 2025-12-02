import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { ListItemsByLocationIdUseCase } from '@/use-cases/stock/items/list-items-by-location-id';

export function makeListItemsByLocationIdUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  return new ListItemsByLocationIdUseCase(itemsRepository);
}
