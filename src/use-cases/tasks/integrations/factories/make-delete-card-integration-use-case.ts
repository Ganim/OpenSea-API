import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardIntegrationsRepository } from '@/repositories/tasks/prisma/prisma-card-integrations-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { DeleteCardIntegrationUseCase } from '../delete-card-integration';

export function makeDeleteCardIntegrationUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardIntegrationsRepository = new PrismaCardIntegrationsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();

  return new DeleteCardIntegrationUseCase(
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardIntegrationsRepository,
    cardActivitiesRepository,
  );
}
