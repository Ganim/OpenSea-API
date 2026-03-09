import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type BoardDTO, boardToDTO } from '@/mappers/tasks/board/board-to-dto';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface ArchiveBoardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  archive: boolean;
}

interface ArchiveBoardResponse {
  board: BoardDTO;
}

export class ArchiveBoardUseCase {
  constructor(private boardsRepository: BoardsRepository) {}

  async execute(request: ArchiveBoardRequest): Promise<ArchiveBoardResponse> {
    const { tenantId, userId, boardId, archive } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (board.ownerId.toString() !== userId) {
      throw new ForbiddenError('Only the board owner can archive this board');
    }

    if (archive) {
      await this.boardsRepository.archive(boardId, tenantId);
      board.archive();
    } else {
      await this.boardsRepository.restore(boardId, tenantId);
      board.restore();
    }

    return { board: boardToDTO(board) };
  }
}
