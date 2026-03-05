import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { InviteBoardMemberUseCase } from '../invite-board-member';

export function makeInviteBoardMemberUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new InviteBoardMemberUseCase(boardsRepository, boardMembersRepository);
}
