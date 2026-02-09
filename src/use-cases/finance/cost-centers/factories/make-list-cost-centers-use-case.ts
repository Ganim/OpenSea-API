import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { ListCostCentersUseCase } from '../list-cost-centers';

export function makeListCostCentersUseCase() {
  const repository = new PrismaCostCentersRepository();
  return new ListCostCentersUseCase(repository);
}
