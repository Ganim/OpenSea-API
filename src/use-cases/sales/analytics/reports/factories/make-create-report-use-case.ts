import { PrismaAnalyticsReportsRepository } from '@/repositories/sales/prisma/prisma-analytics-reports-repository';
import { CreateReportUseCase } from '../create-report';

export function makeCreateReportUseCase() {
  const reportsRepository = new PrismaAnalyticsReportsRepository();
  return new CreateReportUseCase(reportsRepository);
}
