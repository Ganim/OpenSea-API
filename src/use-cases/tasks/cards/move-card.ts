import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type CardDTO, cardToDTO } from '@/mappers/tasks/card/card-to-dto';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface MoveCardRequest {
  tenantId: string;
  userId: string;
  userName: string;
  boardId: string;
  cardId: string;
  columnId: string;
  position?: number;
}

interface MoveCardResponse {
  card: CardDTO;
}

export class MoveCardUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
    private cardsRepository: CardsRepository,
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(request: MoveCardRequest): Promise<MoveCardResponse> {
    const { tenantId, userId, userName, boardId, cardId, columnId } =
      request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const targetColumn = await this.boardColumnsRepository.findById(
      columnId,
      boardId,
    );

    if (!targetColumn) {
      throw new ResourceNotFoundError('Target column not found');
    }

    const oldColumnId = card.columnId.toString();

    const oldColumn = await this.boardColumnsRepository.findById(
      oldColumnId,
      boardId,
    );

    const oldColumnName = oldColumn?.title ?? 'Desconhecida';
    const newColumnName = targetColumn.title;

    let resolvedPosition = request.position;

    if (resolvedPosition === undefined) {
      resolvedPosition =
        await this.cardsRepository.countByColumnId(columnId);
    }

    let completedAt: Date | null | undefined;

    if (targetColumn.isDone && !card.isCompleted) {
      completedAt = new Date();
    } else if (!targetColumn.isDone && card.isCompleted) {
      completedAt = null;
    }

    const updatedCard = await this.cardsRepository.update({
      id: cardId,
      boardId,
      columnId,
      position: resolvedPosition,
      status: targetColumn.isDone ? 'DONE' : undefined,
      completedAt,
    });

    if (!updatedCard) {
      throw new ResourceNotFoundError('Card not found');
    }

    if (oldColumnId !== columnId) {
      await this.cardActivitiesRepository.create({
        cardId,
        boardId,
        userId,
        type: 'MOVED',
        description: `${userName} moveu o cartão ${card.title} de ${oldColumnName} para ${newColumnName}`,
        field: 'columnId',
        oldValue: oldColumnId,
        newValue: columnId,
      });

      const subtasks = await this.cardsRepository.findSubtasks(cardId);

      if (subtasks.length > 0) {
        await this.cardsRepository.updateManyColumn(
          subtasks.map((s) => s.id.toString()),
          boardId,
          columnId,
        );
      }
    }

    return { card: cardToDTO(updatedCard) };
  }
}
