import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCompetenciesRepository } from '@/repositories/hr/prisma/prisma-review-competencies-repository';
import { GetPerformanceReviewUseCase } from '../get-performance-review';

export function makeGetPerformanceReviewUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  const reviewCompetenciesRepository = new PrismaReviewCompetenciesRepository();
  return new GetPerformanceReviewUseCase(
    performanceReviewsRepository,
    reviewCompetenciesRepository,
  );
}
