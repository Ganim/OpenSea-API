import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { CreateCommentUseCase } from '../create-comment';

export function makeCreateCommentUseCase() {
  const cardsRepository = new PrismaCardsRepository();
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new CreateCommentUseCase(
    cardsRepository,
    cardCommentsRepository,
    cardActivitiesRepository,
  );
}
