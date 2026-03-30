import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { DeleteReviewCycleUseCase } from '../delete-review-cycle';

export function makeDeleteReviewCycleUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new DeleteReviewCycleUseCase(reviewCyclesRepository);
}
