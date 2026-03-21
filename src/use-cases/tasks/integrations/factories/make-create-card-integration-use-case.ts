import { PrismaBoardMembersRepository } from '@/repositories/tasks/prisma/prisma-board-members-repository';
import { PrismaBoardsRepository } from '@/repositories/tasks/prisma/prisma-boards-repository';
import { PrismaCardActivitiesRepository } from '@/repositories/tasks/prisma/prisma-card-activities-repository';
import { PrismaCardIntegrationsRepository } from '@/repositories/tasks/prisma/prisma-card-integrations-repository';
import { PrismaCardsRepository } from '@/repositories/tasks/prisma/prisma-cards-repository';
import { CreateCardIntegrationUseCase } from '../create-card-integration';

export function makeCreateCardIntegrationUseCase() {
  const boardsRepository = new PrismaBoardsRepository();
  const boardMembersRepository = new PrismaBoardMembersRepository();
  const cardsRepository = new PrismaCardsRepository();
  const cardIntegrationsRepository = new PrismaCardIntegrationsRepository();
  const cardActivitiesRepository = new PrismaCardActivitiesRepository();

  return new CreateCardIntegrationUseCase(
    boardsRepository,
    boardMembersRepository,
    cardsRepository,
    cardIntegrationsRepository,
    cardActivitiesRepository,
  );
}
