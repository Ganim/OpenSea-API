import { PrismaPrintJobsRepository } from '@/repositories/sales/prisma/prisma-print-jobs-repository';
import { RetryPrintJobUseCase } from '../retry-print-job.use-case';

export function makeRetryPrintJobUseCase() {
  return new RetryPrintJobUseCase(new PrismaPrintJobsRepository());
}
