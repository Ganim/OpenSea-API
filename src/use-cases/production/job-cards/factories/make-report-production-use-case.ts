import { PrismaJobCardsRepository } from '@/repositories/production/prisma/prisma-job-cards-repository';
import { ReportProductionUseCase } from '../report-production';

export function makeReportProductionUseCase() {
  const jobCardsRepository = new PrismaJobCardsRepository();
  const reportProductionUseCase = new ReportProductionUseCase(
    jobCardsRepository,
  );
  return reportProductionUseCase;
}
