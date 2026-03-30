import { PrismaReviewCyclesRepository } from '@/repositories/hr/prisma/prisma-review-cycles-repository';
import { ListReviewCyclesUseCase } from '../list-review-cycles';

export function makeListReviewCyclesUseCase() {
  const reviewCyclesRepository = new PrismaReviewCyclesRepository();
  return new ListReviewCyclesUseCase(reviewCyclesRepository);
}
