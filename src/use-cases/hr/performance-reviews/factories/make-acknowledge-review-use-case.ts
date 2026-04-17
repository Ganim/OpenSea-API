import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { AcknowledgeReviewUseCase } from '../acknowledge-review';

export function makeAcknowledgeReviewUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new AcknowledgeReviewUseCase(
    performanceReviewsRepository,
    employeesRepository,
  );
}
