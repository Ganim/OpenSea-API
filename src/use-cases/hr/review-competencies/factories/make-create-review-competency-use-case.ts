import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCompetenciesRepository } from '@/repositories/hr/prisma/prisma-review-competencies-repository';
import { CreateReviewCompetencyUseCase } from '../create-review-competency';

export function makeCreateReviewCompetencyUseCase() {
  const reviewCompetenciesRepository = new PrismaReviewCompetenciesRepository();
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new CreateReviewCompetencyUseCase(
    reviewCompetenciesRepository,
    performanceReviewsRepository,
  );
}
