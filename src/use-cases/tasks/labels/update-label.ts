import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardLabelsRepository,
  BoardLabelRecord,
} from '@/repositories/tasks/board-labels-repository';

interface UpdateLabelRequest {
  boardId: string;
  labelId: string;
  name?: string;
  color?: string;
}

interface UpdateLabelResponse {
  label: BoardLabelRecord;
}

export class UpdateLabelUseCase {
  constructor(private boardLabelsRepository: BoardLabelsRepository) {}

  async execute(request: UpdateLabelRequest): Promise<UpdateLabelResponse> {
    const { boardId, labelId, name, color } = request;

    const existingLabel = await this.boardLabelsRepository.findById(
      labelId,
      boardId,
    );

    if (!existingLabel) {
      throw new ResourceNotFoundError('Label not found');
    }

    const updatedLabel = await this.boardLabelsRepository.update({
      id: labelId,
      boardId,
      name: name?.trim(),
      color,
    });

    if (!updatedLabel) {
      throw new ResourceNotFoundError('Label not found');
    }

    return { label: updatedLabel };
  }
}
