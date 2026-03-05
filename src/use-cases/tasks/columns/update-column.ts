import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  BoardColumnsRepository,
  BoardColumnRecord,
} from '@/repositories/tasks/board-columns-repository';

interface UpdateColumnRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  columnId: string;
  title?: string;
  color?: string | null;
  isDone?: boolean;
  wipLimit?: number | null;
}

interface UpdateColumnResponse {
  column: BoardColumnRecord;
}

export class UpdateColumnUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
  ) {}

  async execute(request: UpdateColumnRequest): Promise<UpdateColumnResponse> {
    const { tenantId, boardId, columnId, title, color, isDone, wipLimit } =
      request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const existingColumn = await this.boardColumnsRepository.findById(
      columnId,
      boardId,
    );

    if (!existingColumn) {
      throw new ResourceNotFoundError('Column not found');
    }

    const updatedColumn = await this.boardColumnsRepository.update({
      id: columnId,
      boardId,
      title,
      color,
      isDone,
      wipLimit,
    });

    if (!updatedColumn) {
      throw new ResourceNotFoundError('Column not found');
    }

    return { column: updatedColumn };
  }
}
