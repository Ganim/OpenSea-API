import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { ListPerformanceReviewsUseCase } from '../list-performance-reviews';

export function makeListPerformanceReviewsUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new ListPerformanceReviewsUseCase(performanceReviewsRepository);
}
