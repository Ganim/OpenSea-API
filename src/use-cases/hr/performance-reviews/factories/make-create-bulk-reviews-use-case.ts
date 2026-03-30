import { PrismaPerformanceReviewsRepository } from '@/repositories/hr/prisma/prisma-performance-reviews-repository';
import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { CreateBulkReviewsUseCase } from '../create-bulk-reviews';

export function makeCreateBulkReviewsUseCase() {
  const performanceReviewsRepository =
    new PrismaPerformanceReviewsRepository();
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new CreateBulkReviewsUseCase(
    performanceReviewsRepository,
    reviewCyclesRepository,
  );
}
