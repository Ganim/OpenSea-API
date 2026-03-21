import { PrismaAnalyticsDashboardsRepository } from '@/repositories/sales/prisma/prisma-analytics-dashboards-repository';
import { CreateDashboardUseCase } from '../create-dashboard';

export function makeCreateDashboardUseCase() {
  const dashboardsRepository = new PrismaAnalyticsDashboardsRepository();
  return new CreateDashboardUseCase(dashboardsRepository);
}
