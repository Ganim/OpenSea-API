import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface DeleteBoardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
}

export class DeleteBoardUseCase {
  constructor(private boardsRepository: BoardsRepository) {}

  async execute(request: DeleteBoardRequest): Promise<void> {
    const { tenantId, userId, boardId } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (board.ownerId.toString() !== userId) {
      throw new ForbiddenError('Only the board owner can delete this board');
    }

    await this.boardsRepository.softDelete(boardId, tenantId);
  }
}
