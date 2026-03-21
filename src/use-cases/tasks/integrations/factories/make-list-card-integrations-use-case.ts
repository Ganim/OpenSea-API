import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardIntegrationsRepository } from '@/repositories/tasks/prisma/prisma-card-integrations-repository';
import { ListCardIntegrationsUseCase } from '../list-card-integrations';

export function makeListCardIntegrationsUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  const cardIntegrationsRepository = new PrismaCardIntegrationsRepository();

  return new ListCardIntegrationsUseCase(
    boardsRepository,
    boardMembersRepository,
    cardIntegrationsRepository,
  );
}
