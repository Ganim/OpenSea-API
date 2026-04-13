import { PrismaProductionCostsRepository } from '@/repositories/production/prisma/prisma-production-costs-repository';
import { UpdateProductionCostUseCase } from '../update-production-cost';

export function makeUpdateProductionCostUseCase() {
  const productionCostsRepository = new PrismaProductionCostsRepository();
  return new UpdateProductionCostUseCase(productionCostsRepository);
}
