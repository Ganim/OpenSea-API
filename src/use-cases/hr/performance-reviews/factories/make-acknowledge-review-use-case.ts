import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { AcknowledgeReviewUseCase } from '../acknowledge-review';

export function makeAcknowledgeReviewUseCase() {
  const performanceReviewsRepository = new PrismaPerformanceReviewsRepository();
  return new AcknowledgeReviewUseCase(performanceReviewsRepository);
}
