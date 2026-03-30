import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { OpenReviewCycleUseCase } from '../open-review-cycle';

export function makeOpenReviewCycleUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new OpenReviewCycleUseCase(reviewCyclesRepository);
}
