import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { GenerateBundleTicketsUseCase } from '../generate-bundle-tickets';

export function makeGenerateBundleTicketsUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  return new GenerateBundleTicketsUseCase(productionOrdersRepository);
}
