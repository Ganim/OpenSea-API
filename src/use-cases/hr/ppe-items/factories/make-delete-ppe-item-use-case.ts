import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { DeletePPEItemUseCase } from '../delete-ppe-item';

export function makeDeletePPEItemUseCase() {
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new DeletePPEItemUseCase(ppeItemsRepository);
}
