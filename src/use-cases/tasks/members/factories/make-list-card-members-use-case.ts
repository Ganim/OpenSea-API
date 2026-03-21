import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardWatchersRepository } from '@/repositories/tasks/prisma/prisma-card-watchers-repository';
import { ListCardMembersUseCase } from '../list-card-members';

export function makeListCardMembersUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  const cardWatchersRepository = new PrismaCardWatchersRepository();
  return new ListCardMembersUseCase(
    boardsRepository,
    boardMembersRepository,
    cardWatchersRepository,
  );
}
