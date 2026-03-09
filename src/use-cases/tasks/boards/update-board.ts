import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { type BoardDTO, boardToDTO } from '@/mappers/tasks/board/board-to-dto';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface UpdateBoardRequest {
  tenantId: string;
  userId: string;
  boardId: string;
  title?: string;
  description?: string | null;
  visibility?: string;
  defaultView?: string;
  settings?: Record<string, unknown> | null;
  gradientId?: string | null;
}

interface UpdateBoardResponse {
  board: BoardDTO;
}

export class UpdateBoardUseCase {
  constructor(private boardsRepository: BoardsRepository) {}

  async execute(request: UpdateBoardRequest): Promise<UpdateBoardResponse> {
    const { tenantId, userId, boardId, title } = request;

    const existingBoard = await this.boardsRepository.findById(
      boardId,
      tenantId,
    );

    if (!existingBoard) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (existingBoard.ownerId.toString() !== userId) {
      throw new ForbiddenError('Only the board owner can update this board');
    }

    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        throw new BadRequestError('Board title is required');
      }

      if (title.length > 256) {
        throw new BadRequestError('Board title must be at most 256 characters');
      }
    }

    const updatedBoard = await this.boardsRepository.update({
      id: boardId,
      tenantId,
      title: title?.trim(),
      description: request.description,
      visibility: request.visibility,
      defaultView: request.defaultView,
      settings: request.settings,
      gradientId: request.gradientId,
    });

    if (!updatedBoard) {
      throw new ResourceNotFoundError('Board not found');
    }

    return { board: boardToDTO(updatedBoard) };
  }
}
