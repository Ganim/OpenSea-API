import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaBoardColumnsRepository } from '@/repositories/tasks/prisma/prisma-board-columns-repository';
import { PrismaBoardLabelsRepository } from '@/repositories/tasks/prisma/prisma-board-labels-repository';
import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { GetBoardUseCase } from '../get-board';

export function makeGetBoardUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardColumnsRepository = new PrismaBoardColumnsRepository();
  const boardLabelsRepository = new PrismaBoardLabelsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  return new GetBoardUseCase(
    boardsRepository,
    boardColumnsRepository,
    boardLabelsRepository,
    boardMembersRepository,
  );
}
