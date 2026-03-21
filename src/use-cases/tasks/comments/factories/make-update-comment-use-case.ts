import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { UpdateCommentUseCase } from '../update-comment';

export function makeUpdateCommentUseCase() {
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new UpdateCommentUseCase(
    cardCommentsRepository,
    cardsRepository,
    cardActivitiesRepository,
  );
}
