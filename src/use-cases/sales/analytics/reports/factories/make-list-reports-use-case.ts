import { PrismaAnalyticsReportsRepository } from '@/repositories/sales/prisma/prisma-analytics-reports-repository';
import { ListReportsUseCase } from '../list-reports';

export function makeListReportsUseCase() {
  const reportsRepository = new PrismaAnalyticsReportsRepository();
  return new ListReportsUseCase(reportsRepository);
}
