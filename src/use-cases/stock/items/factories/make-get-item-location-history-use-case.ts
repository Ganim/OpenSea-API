import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { GetItemLocationHistoryUseCase } from '../get-item-location-history';

export function makeGetItemLocationHistoryUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();

  return new GetItemLocationHistoryUseCase(
    itemsRepository,
    itemMovementsRepository,
  );
}
