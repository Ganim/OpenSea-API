import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  BoardColumnsRepository,
  BoardColumnRecord,
} from '@/repositories/tasks/board-columns-repository';

interface ReorderColumnsRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  columnIds: string[];
}

interface ReorderColumnsResponse {
  columns: BoardColumnRecord[];
}

export class ReorderColumnsUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
  ) {}

  async execute(
    request: ReorderColumnsRequest,
  ): Promise<ReorderColumnsResponse> {
    const { tenantId, boardId, columnIds } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const existingColumns =
      await this.boardColumnsRepository.findByBoardId(boardId);

    const existingColumnIds = existingColumns.map((col) => col.id).sort();
    const providedColumnIds = [...columnIds].sort();

    if (existingColumnIds.length !== providedColumnIds.length) {
      throw new BadRequestError(
        'Provided column IDs do not match all board columns',
      );
    }

    const allColumnsMatch = existingColumnIds.every(
      (id, index) => id === providedColumnIds[index],
    );

    if (!allColumnsMatch) {
      throw new BadRequestError(
        'Provided column IDs do not match all board columns',
      );
    }

    await this.boardColumnsRepository.reorderMany(
      columnIds.map((id, position) => ({ id, position })),
      boardId,
    );

    const reorderedColumns =
      await this.boardColumnsRepository.findByBoardId(boardId);

    return { columns: reorderedColumns };
  }
}
