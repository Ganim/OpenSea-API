import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { SubmitSelfAssessmentUseCase } from '../submit-self-assessment';

export function makeSubmitSelfAssessmentUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  return new SubmitSelfAssessmentUseCase(
    performanceReviewsRepository,
    employeesRepository,
  );
}
