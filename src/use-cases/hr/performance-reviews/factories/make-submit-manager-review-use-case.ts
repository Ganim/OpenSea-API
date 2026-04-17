import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { SubmitManagerReviewUseCase } from '../submit-manager-review';

export function makeSubmitManagerReviewUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new SubmitManagerReviewUseCase(
    performanceReviewsRepository,
    employeesRepository,
  );
}
