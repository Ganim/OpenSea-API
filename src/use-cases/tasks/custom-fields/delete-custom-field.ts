import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { BoardCustomFieldsRepository } from '@/repositories/tasks/board-custom-fields-repository';
import type { CardCustomFieldValuesRepository } from '@/repositories/tasks/card-custom-field-values-repository';

interface DeleteCustomFieldRequest {
  boardId: string;
  fieldId: string;
}

export class DeleteCustomFieldUseCase {
  constructor(
    private boardCustomFieldsRepository: BoardCustomFieldsRepository,
    private cardCustomFieldValuesRepository: CardCustomFieldValuesRepository,
  ) {}

  async execute(request: DeleteCustomFieldRequest): Promise<void> {
    const { boardId, fieldId } = request;

    const existingField = await this.boardCustomFieldsRepository.findById(
      fieldId,
      boardId,
    );

    if (!existingField) {
      throw new ResourceNotFoundError('Custom field not found');
    }

    await this.cardCustomFieldValuesRepository.deleteByFieldId(fieldId);
    await this.boardCustomFieldsRepository.delete(fieldId, boardId);
  }
}
