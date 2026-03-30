import { PrismaPPEAssignmentsRepository } from '@/repositories/hr/prisma/prisma-ppe-assignments-repository';
import { PrismaPPEItemsRepository } from '@/repositories/hr/prisma/prisma-ppe-items-repository';
import { ReturnPPEUseCase } from '../return-ppe';

export function makeReturnPPEUseCase() {
  const ppeAssignmentsRepository = new PrismaPPEAssignmentsRepository();
  const ppeItemsRepository = new PrismaPPEItemsRepository();
  return new ReturnPPEUseCase(ppeAssignmentsRepository, ppeItemsRepository);
}
