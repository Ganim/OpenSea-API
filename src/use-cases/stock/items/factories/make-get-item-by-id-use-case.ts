import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { GetItemByIdUseCase } from '../get-item-by-id';

export function makeGetItemByIdUseCase() {
  const itemsRepository = new PrismaItemsRepository();

  return new GetItemByIdUseCase(itemsRepository);
}
