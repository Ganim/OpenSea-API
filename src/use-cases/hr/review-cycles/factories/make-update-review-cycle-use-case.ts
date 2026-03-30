import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { UpdateReviewCycleUseCase } from '../update-review-cycle';

export function makeUpdateReviewCycleUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new UpdateReviewCycleUseCase(reviewCyclesRepository);
}
