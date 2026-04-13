import { PrismaProductionCostsRepository } from '@/repositories/production/prisma/prisma-production-costs-repository';
import { CreateProductionCostUseCase } from '../create-production-cost';

export function makeCreateProductionCostUseCase() {
  const productionCostsRepository = new PrismaProductionCostsRepository();
  return new CreateProductionCostUseCase(productionCostsRepository);
}
