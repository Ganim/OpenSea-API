import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { RemoveCardMemberUseCase } from '../remove-card-member';

export function makeRemoveCardMemberUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();
  return new RemoveCardMemberUseCase(
    boardsRepository,
    boardMembersRepository,
    cardWatchersRepository,
    cardActivitiesRepository,
  );
}
