import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { UpdatePPEItemUseCase } from '../update-ppe-item';

export function makeUpdatePPEItemUseCase() {
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new UpdatePPEItemUseCase(ppeItemsRepository);
}
