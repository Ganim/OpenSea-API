import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { GetVariantItemsStatsUseCase } from '../get-variant-items-stats';

export function makeGetVariantItemsStatsUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  return new GetVariantItemsStatsUseCase(itemsRepository);
}
