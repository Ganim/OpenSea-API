import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCompetenciesRepository } from '@/repositories/hr/prisma/prisma-review-competencies-repository';
import { UpdateReviewCompetencyUseCase } from '../update-review-competency';

export function makeUpdateReviewCompetencyUseCase() {
  const reviewCompetenciesRepository = new PrismaReviewCompetenciesRepository();
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new UpdateReviewCompetencyUseCase(
    reviewCompetenciesRepository,
    performanceReviewsRepository,
  );
}
