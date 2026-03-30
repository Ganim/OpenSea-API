import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { GetPPEItemUseCase } from '../get-ppe-item';

export function makeGetPPEItemUseCase() {
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new GetPPEItemUseCase(ppeItemsRepository);
}
