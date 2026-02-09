import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { DeleteCostCenterUseCase } from '../delete-cost-center';

export function makeDeleteCostCenterUseCase() {
  const repository = new PrismaCostCentersRepository();
  return new DeleteCostCenterUseCase(repository);
}
