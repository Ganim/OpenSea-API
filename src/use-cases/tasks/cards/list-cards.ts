import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface ListCardsRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  columnId?: string;
  assigneeId?: string;
  labelIds?: string[];
  priority?: string;
  status?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

interface ListCardsResponse {
  cards: CardDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListCardsUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private cardsRepository: CardsRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(request: ListCardsRequest): Promise<ListCardsResponse> {
    const { tenantId, boardId } = request;
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    await verifyBoardAccess(this.boardMembersRepository, board, request.userId, 'read');

    const { cards, total } = await this.cardsRepository.findMany({
      boardId,
      columnId: request.columnId,
      assigneeId: request.assigneeId,
      labelIds: request.labelIds,
      priority: request.priority,
      status: request.status,
      search: request.search,
      startDate: request.startDate,
      endDate: request.endDate,
      parentCardId: null,
      page,
      limit,
    });

    const cardDTOs = cards.map((card) => cardToDTO(card));

    return {
      cards: cardDTOs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
