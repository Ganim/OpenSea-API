import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardLabelsRepository,
  BoardLabelRecord,
} from '@/repositories/tasks/board-labels-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface CreateLabelRequest {
  tenantId: string;
  boardId: string;
  name: string;
  color: string;
}

interface CreateLabelResponse {
  label: BoardLabelRecord;
}

export class CreateLabelUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardLabelsRepository: BoardLabelsRepository,
  ) {}

  async execute(request: CreateLabelRequest): Promise<CreateLabelResponse> {
    const { tenantId, boardId, name, color } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Label name is required');
    }

    const existingLabels =
      await this.boardLabelsRepository.findByBoardId(boardId);

    const nextPosition = existingLabels.length;

    const label = await this.boardLabelsRepository.create({
      boardId,
      name: name.trim(),
      color,
      position: nextPosition,
    });

    return { label };
  }
}
