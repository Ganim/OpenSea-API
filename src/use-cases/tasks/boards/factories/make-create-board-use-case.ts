import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { CreateBoardUseCase } from '../create-board';

export function makeCreateBoardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new CreateBoardUseCase(
    boardsRepository,
    boardColumnsRepository,
    boardMembersRepository,
  );
}
