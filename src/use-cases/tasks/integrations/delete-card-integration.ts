import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type {
  CardIntegrationsRepository,
  CardIntegrationRecord,
} from '@/repositories/tasks/card-integrations-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface DeleteCardIntegrationRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  integrationId: string;
}

interface DeleteCardIntegrationResponse {
  deletedIntegration: CardIntegrationRecord;
}

export class DeleteCardIntegrationUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
    private cardsRepository: CardsRepository,
    private cardIntegrationsRepository: CardIntegrationsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: DeleteCardIntegrationRequest,
  ): Promise<DeleteCardIntegrationResponse> {
    const { tenantId, userId, userName, boardId, cardId, integrationId } =
      request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(
      this.boardMembersRepository,
      board,
      userId,
      'write',
    );

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const integration =
      await this.cardIntegrationsRepository.findById(integrationId);

    if (!integration || integration.cardId !== cardId) {
      throw new ResourceNotFoundError('Integration not found');
    }

    await this.cardIntegrationsRepository.delete(integrationId);

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'INTEGRATION_REMOVED',
      description: `${userName} removeu a integração ${integration.entityLabel} do cartão ${card.title}`,
    });

    return { deletedIntegration: integration };
  }
}
