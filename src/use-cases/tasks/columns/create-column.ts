import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';
import type {
  BoardColumnsRepository,
  BoardColumnRecord,
} from '@/repositories/tasks/board-columns-repository';

interface CreateColumnRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  title: string;
  color?: string | null;
  isDone?: boolean;
  wipLimit?: number | null;
}

interface CreateColumnResponse {
  column: BoardColumnRecord;
}

export class CreateColumnUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardColumnsRepository: BoardColumnsRepository,
  ) {}

  async execute(request: CreateColumnRequest): Promise<CreateColumnResponse> {
    const { tenantId, boardId, title, color, isDone, wipLimit } = request;

    if (!title || title.trim().length === 0) {
      throw new BadRequestError('Column title is required');
    }

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    const existingColumns =
      await this.boardColumnsRepository.findByBoardId(boardId);

    const maxPosition =
      existingColumns.length > 0
        ? Math.max(...existingColumns.map((col) => col.position))
        : -1;

    const column = await this.boardColumnsRepository.create({
      boardId,
      title: title.trim(),
      color: color ?? null,
      position: maxPosition + 1,
      isDone: isDone ?? false,
      wipLimit: wipLimit ?? null,
    });

    return { column };
  }
}
