import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { DeleteCommentUseCase } from '../delete-comment';

export function makeDeleteCommentUseCase() {
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new DeleteCommentUseCase(
    cardCommentsRepository,
    cardsRepository,
    cardActivitiesRepository,
  );
}
