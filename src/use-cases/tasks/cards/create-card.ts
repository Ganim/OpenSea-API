import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { BoardMembersRepository } from '@/repositories/tasks/board-members-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';
import { verifyBoardAccess } from '../helpers/verify-board-access';

interface CreateCardRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  columnId?: string;
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  assigneeId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimatedMinutes?: number | null;
  coverColor?: string | null;
  labelIds?: string[];
  metadata?: Record<string, unknown> | null;
  systemSourceType?: string | null;
  systemSourceId?: string | null;
}

interface CreateCardResponse {
  card: CardDTO;
}

export class CreateCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
    private boardMembersRepository: BoardMembersRepository,
  ) {}

  async execute(request: CreateCardRequest): Promise<CreateCardResponse> {
    const {
      tenantId,
      userId,
      userName,
      boardId,
      title,
      description,
      status,
      priority,
      assigneeId,
      startDate,
      dueDate,
      estimatedMinutes,
      coverColor,
      labelIds,
      metadata,
      systemSourceType,
      systemSourceId,
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

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Card title is required');
    }

    if (title.length > 512) {
      throw new BadRequestError('Card title must be at most 512 characters');
    }

    let resolvedColumnId = request.columnId;

    if (!resolvedColumnId) {
      const defaultColumn =
        await this.boardColumnsRepository.findDefaultColumn(boardId);

      if (!defaultColumn) {
        throw new ResourceNotFoundError(
          'No default column found for this board',
        );
      }

      resolvedColumnId = defaultColumn.id;
    } else {
      const column = await this.boardColumnsRepository.findById(
        resolvedColumnId,
        boardId,
      );

      if (!column) {
        throw new ResourceNotFoundError('Column not found');
      }
    }

    const nextPosition =
      await this.cardsRepository.getNextPosition(resolvedColumnId);

    const card = await this.cardsRepository.create({
      boardId,
      columnId: resolvedColumnId,
      title: title.trim(),
      description,
      status,
      priority,
      position: nextPosition,
      assigneeId,
      reporterId: userId,
      startDate,
      dueDate,
      estimatedMinutes,
      coverColor,
      labelIds,
      metadata,
      systemSourceType,
      systemSourceId,
    });

    const cardId = card.id.toString();

    await this.cardActivitiesRepository.create({
      cardId,
      boardId,
      userId,
      type: 'CREATED',
      description: `${userName} criou o cartão ${title.trim()}`,
    });

    return { card: cardToDTO(card) };
  }
}
