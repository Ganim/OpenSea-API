import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  CardIntegrationsRepository,
  CardIntegrationRecord,
} from '@/repositories/tasks/card-integrations-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface ListCardIntegrationsRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  cardId: string;
}

interface ListCardIntegrationsResponse {
  integrations: CardIntegrationRecord[];
}

export class ListCardIntegrationsUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardMembersRepository: BoardMembersRepository,
    private cardIntegrationsRepository: CardIntegrationsRepository,
  ) {}

  async execute(
    request: ListCardIntegrationsRequest,
  ): Promise<ListCardIntegrationsResponse> {
    const { tenantId, userId, boardId, cardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(this.boardMembersRepository, board, userId, 'read');

    const integrations =
      await this.cardIntegrationsRepository.findByCardId(cardId);

    return { integrations };
  }
}
