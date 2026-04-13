import { PrismaProductionCostsRepository } from '@/repositories/production/prisma/prisma-production-costs-repository';
import { ListProductionCostsUseCase } from '../list-production-costs';

export function makeListProductionCostsUseCase() {
  const productionCostsRepository = new PrismaProductionCostsRepository();
  return new ListProductionCostsUseCase(productionCostsRepository);
}
