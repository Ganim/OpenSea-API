import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCompetenciesRepository } from '@/repositories/hr/prisma/prisma-review-competencies-repository';
import { SeedDefaultReviewCompetenciesUseCase } from '../seed-default-review-competencies';

export function makeSeedDefaultReviewCompetenciesUseCase() {
  const reviewCompetenciesRepository = new PrismaReviewCompetenciesRepository();
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new SeedDefaultReviewCompetenciesUseCase(
    reviewCompetenciesRepository,
    performanceReviewsRepository,
  );
}
