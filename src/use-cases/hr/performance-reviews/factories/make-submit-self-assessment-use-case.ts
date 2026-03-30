import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { SubmitSelfAssessmentUseCase } from '../submit-self-assessment';

export function makeSubmitSelfAssessmentUseCase() {
  const performanceReviewsRepository =
    new PrismaPerformanceReviewsRepository();
  return new SubmitSelfAssessmentUseCase(performanceReviewsRepository);
}
