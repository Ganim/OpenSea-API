import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { PrismaPrintJobsRepository } from '@/repositories/sales/prisma/prisma-print-jobs-repository';
import { CreateLabelPrintJobUseCase } from '../create-label-print-job.use-case';

export function makeCreateLabelPrintJobUseCase() {
  return new CreateLabelPrintJobUseCase(
    new PrismaPosPrintersRepository(),
    new PrismaPrintJobsRepository(),
  );
}
