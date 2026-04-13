import { PrismaProductionCostsRepository } from '@/repositories/production/prisma/prisma-production-costs-repository';
import { CalculateOrderCostUseCase } from '../calculate-order-cost';

export function makeCalculateOrderCostUseCase() {
  const productionCostsRepository = new PrismaProductionCostsRepository();
  return new CalculateOrderCostUseCase(productionCostsRepository);
}
