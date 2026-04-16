import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCompetenciesRepository } from '@/repositories/hr/prisma/prisma-review-competencies-repository';
import { DeleteReviewCompetencyUseCase } from '../delete-review-competency';

export function makeDeleteReviewCompetencyUseCase() {
  const reviewCompetenciesRepository = new PrismaReviewCompetenciesRepository();
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new DeleteReviewCompetencyUseCase(
    reviewCompetenciesRepository,
    performanceReviewsRepository,
  );
}
