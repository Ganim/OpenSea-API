import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { GetPerformanceReviewUseCase } from '../get-performance-review';

export function makeGetPerformanceReviewUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new GetPerformanceReviewUseCase(performanceReviewsRepository);
}
