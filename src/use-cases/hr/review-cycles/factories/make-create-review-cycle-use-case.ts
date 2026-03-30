import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { CreateReviewCycleUseCase } from '../create-review-cycle';

export function makeCreateReviewCycleUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new CreateReviewCycleUseCase(reviewCyclesRepository);
}
