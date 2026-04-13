import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { GenerateCutPlanUseCase } from '../generate-cut-plan';

export function makeGenerateCutPlanUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  return new GenerateCutPlanUseCase(productionOrdersRepository);
}
