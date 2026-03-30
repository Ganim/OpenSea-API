import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { ListPPEItemsUseCase } from '../list-ppe-items';

export function makeListPPEItemsUseCase() {
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new ListPPEItemsUseCase(ppeItemsRepository);
}
