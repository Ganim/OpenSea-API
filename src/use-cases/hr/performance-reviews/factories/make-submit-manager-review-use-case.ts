import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { SubmitManagerReviewUseCase } from '../submit-manager-review';

export function makeSubmitManagerReviewUseCase() {
  const performanceReviewsRepository =
    new PrismaPerformanceReviewsRepository();
  return new SubmitManagerReviewUseCase(performanceReviewsRepository);
}
