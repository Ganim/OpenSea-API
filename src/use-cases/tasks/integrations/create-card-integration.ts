import { ConflictError } from '@/@errors/use-cases/conflict-error';
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

interface CreateCardIntegrationRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  type: string;
  entityId: string;
  entityLabel: string;
}

interface CreateCardIntegrationResponse {
  integration: CardIntegrationRecord;
}

export class CreateCardIntegrationUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
    private cardsRepository: CardsRepository,
    private cardIntegrationsRepository: CardIntegrationsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: CreateCardIntegrationRequest,
  ): Promise<CreateCardIntegrationResponse> {
    const {
      tenantId,
      userId,
      userName,
      boardId,
      cardId,
      type,
      entityId,
      entityLabel,
    } = request;

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

    const existing = await this.cardIntegrationsRepository.findByCardAndEntity(
      cardId,
      type,
      entityId,
    );

    if (existing) {
      throw new ConflictError('This integration already exists for this card');
    }

    const integration = await this.cardIntegrationsRepository.create({
      cardId,
      type,
      entityId,
      entityLabel,
      createdBy: userId,
    });

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'INTEGRATION_ADDED',
      description: `${userName} vinculou ${entityLabel} ao cartão ${card.title}`,
    });

    return { integration };
  }
}
