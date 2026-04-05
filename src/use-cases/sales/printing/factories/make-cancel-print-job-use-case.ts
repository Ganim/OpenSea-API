import { PrismaPrintJobsRepository } from '@/repositories/sales/prisma/prisma-print-jobs-repository';
import { CancelPrintJobUseCase } from '../cancel-print-job.use-case';

export function makeCancelPrintJobUseCase() {
  return new CancelPrintJobUseCase(new PrismaPrintJobsRepository());
}
