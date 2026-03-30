import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { CreatePPEItemUseCase } from '../create-ppe-item';

export function makeCreatePPEItemUseCase() {
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new CreatePPEItemUseCase(ppeItemsRepository);
}
