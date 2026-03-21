import { PrismaAnalyticsDashboardsRepository } from '@/repositories/sales/prisma/prisma-analytics-dashboards-repository';
import { ListDashboardsUseCase } from '../list-dashboards';

export function makeListDashboardsUseCase() {
  const dashboardsRepository = new PrismaAnalyticsDashboardsRepository();
  return new ListDashboardsUseCase(dashboardsRepository);
}
