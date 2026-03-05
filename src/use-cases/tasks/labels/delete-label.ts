import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardLabelsRepository } from '@/repositories/tasks/board-labels-repository';

interface DeleteLabelRequest {
  boardId: string;
  labelId: string;
}

export class DeleteLabelUseCase {
  constructor(private boardLabelsRepository: BoardLabelsRepository) {}

  async execute(request: DeleteLabelRequest): Promise<void> {
    const { boardId, labelId } = request;

    const existingLabel = await this.boardLabelsRepository.findById(
      labelId,
      boardId,
    );

    if (!existingLabel) {
      throw new ResourceNotFoundError('Label not found');
    }

    await this.boardLabelsRepository.delete(labelId, boardId);
  }
}
