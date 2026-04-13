import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { GetProductionDashboardUseCase } from '../get-production-dashboard';

export function makeGetProductionDashboardUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  return new GetProductionDashboardUseCase(productionOrdersRepository);
}
