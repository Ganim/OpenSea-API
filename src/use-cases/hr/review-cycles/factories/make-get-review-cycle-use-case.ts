import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { GetReviewCycleUseCase } from '../get-review-cycle';

export function makeGetReviewCycleUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new GetReviewCycleUseCase(reviewCyclesRepository);
}
