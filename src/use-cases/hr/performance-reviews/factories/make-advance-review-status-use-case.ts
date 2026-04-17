import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { AdvanceReviewStatusUseCase } from '../advance-status';

export function makeAdvanceReviewStatusUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new AdvanceReviewStatusUseCase(
    performanceReviewsRepository,
    employeesRepository,
  );
}
