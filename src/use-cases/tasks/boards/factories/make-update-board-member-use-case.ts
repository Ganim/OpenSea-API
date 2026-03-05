import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { UpdateBoardMemberUseCase } from '../update-board-member';

export function makeUpdateBoardMemberUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new UpdateBoardMemberUseCase(boardsRepository, boardMembersRepository);
}
