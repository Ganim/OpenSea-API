import { PrismaPrintJobsRepository } from '@/repositories/sales/prisma/prisma-print-jobs-repository';
import { ListPrintJobsUseCase } from '../list-print-jobs.use-case';

export function makeListPrintJobsUseCase() {
  return new ListPrintJobsUseCase(new PrismaPrintJobsRepository());
}
