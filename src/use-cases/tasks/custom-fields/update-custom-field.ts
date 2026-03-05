import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardCustomFieldsRepository,
  BoardCustomFieldRecord,
} from '@/repositories/tasks/board-custom-fields-repository';

interface UpdateCustomFieldRequest {
  boardId: string;
  fieldId: string;
  name?: string;
  options?: Record<string, unknown> | null;
  isRequired?: boolean;
}

interface UpdateCustomFieldResponse {
  customField: BoardCustomFieldRecord;
}

export class UpdateCustomFieldUseCase {
  constructor(
    private boardCustomFieldsRepository: BoardCustomFieldsRepository,
  ) {}

  async execute(
    request: UpdateCustomFieldRequest,
  ): Promise<UpdateCustomFieldResponse> {
    const { boardId, fieldId, name, options, isRequired } = request;

    const existingField = await this.boardCustomFieldsRepository.findById(
      fieldId,
      boardId,
    );

    if (!existingField) {
      throw new ResourceNotFoundError('Custom field not found');
    }

    const updatedField = await this.boardCustomFieldsRepository.update({
      id: fieldId,
      boardId,
      name: name?.trim(),
      options,
      isRequired,
    });

    if (!updatedField) {
      throw new ResourceNotFoundError('Custom field not found');
    }

    return { customField: updatedField };
  }
}
