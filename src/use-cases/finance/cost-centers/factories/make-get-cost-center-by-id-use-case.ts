import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { GetCostCenterByIdUseCase } from '../get-cost-center-by-id';

export function makeGetCostCenterByIdUseCase() {
  const repository = new PrismaCostCentersRepository();
  return new GetCostCenterByIdUseCase(repository);
}
