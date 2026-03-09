import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type { BoardColumnsRepository } from '@/repositories/tasks/board-columns-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface DeleteColumnRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  columnId: string;
  migrateToColumnId?: string;
}

export class DeleteColumnUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
    private cardsRepository: CardsRepository,
  ) {}

  async execute(request: DeleteColumnRequest): Promise<void> {
    const { tenantId, boardId, columnId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const targetColumn = await this.boardColumnsRepository.findById(
      columnId,
      boardId,
    );

    if (!targetColumn) {
      throw new ResourceNotFoundError('Column not found');
    }

    if (targetColumn.isDefault) {
      throw new BadRequestError('Cannot delete the default column');
    }

    const boardColumns =
      await this.boardColumnsRepository.findByBoardId(boardId);

    if (boardColumns.length <= 1) {
      throw new BadRequestError('Cannot delete the last remaining column');
    }

    let targetColumnId = request.migrateToColumnId;

    if (targetColumnId) {
      const migrateColumn = await this.boardColumnsRepository.findById(
        targetColumnId,
        boardId,
      );

      if (!migrateColumn) {
        throw new ResourceNotFoundError('Migration target column not found');
      }
    } else {
      const defaultColumn =
        await this.boardColumnsRepository.findDefaultColumn(boardId);

      if (!defaultColumn) {
        throw new BadRequestError('No default column found to move cards to');
      }

      targetColumnId = defaultColumn.id;
    }

    // Move all cards in the deleted column to the target column
    const { cards: cardsInColumn } = await this.cardsRepository.findMany({
      boardId,
      columnId,
      includeArchived: true,
    });

    for (const card of cardsInColumn) {
      await this.cardsRepository.update({
        id: card.id.toString(),
        boardId,
        columnId: targetColumnId,
      });
    }

    await this.boardColumnsRepository.delete(columnId, boardId);
  }
}
