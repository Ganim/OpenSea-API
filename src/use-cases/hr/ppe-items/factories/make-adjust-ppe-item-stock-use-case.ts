import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { AdjustPPEItemStockUseCase } from '../adjust-ppe-item-stock';

export function makeAdjustPPEItemStockUseCase() {
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new AdjustPPEItemStockUseCase(ppeItemsRepository);
}
