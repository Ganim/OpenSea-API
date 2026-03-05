import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { RemoveBoardMemberUseCase } from '../remove-board-member';

export function makeRemoveBoardMemberUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new RemoveBoardMemberUseCase(boardsRepository, boardMembersRepository);
}
