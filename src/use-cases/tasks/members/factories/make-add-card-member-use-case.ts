import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { AddCardMemberUseCase } from '../add-card-member';

export function makeAddCardMemberUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new AddCardMemberUseCase(
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardWatchersRepository,
    cardActivitiesRepository,
  );
}
