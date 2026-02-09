import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { UpdateCostCenterUseCase } from '../update-cost-center';

export function makeUpdateCostCenterUseCase() {
  const repository = new PrismaCostCentersRepository();
  return new UpdateCostCenterUseCase(repository);
}
