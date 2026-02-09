import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { CreateCostCenterUseCase } from '../create-cost-center';

export function makeCreateCostCenterUseCase() {
  const repository = new PrismaCostCentersRepository();
  return new CreateCostCenterUseCase(repository);
}
