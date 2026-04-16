import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCompetenciesRepository } from '@/repositories/hr/prisma/prisma-review-competencies-repository';
import { ListReviewCompetenciesUseCase } from '../list-review-competencies';

export function makeListReviewCompetenciesUseCase() {
  const reviewCompetenciesRepository = new PrismaReviewCompetenciesRepository();
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new ListReviewCompetenciesUseCase(
    reviewCompetenciesRepository,
    performanceReviewsRepository,
  );
}
