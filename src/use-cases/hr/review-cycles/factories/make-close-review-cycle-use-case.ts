import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { CloseReviewCycleUseCase } from '../close-review-cycle';

export function makeCloseReviewCycleUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new CloseReviewCycleUseCase(reviewCyclesRepository);
}
