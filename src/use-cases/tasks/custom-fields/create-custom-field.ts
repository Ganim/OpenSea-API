import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardCustomFieldsRepository,
  BoardCustomFieldRecord,
} from '@/repositories/tasks/board-custom-fields-repository';
import type { BoardsRepository } from '@/repositories/tasks/boards-repository';

interface CreateCustomFieldRequest {
  tenantId: string;
  boardId: string;
  name: string;
  type: string;
  options?: Record<string, unknown> | null;
  isRequired?: boolean;
}

interface CreateCustomFieldResponse {
  customField: BoardCustomFieldRecord;
}

const TYPES_REQUIRING_OPTIONS = ['SELECT', 'MULTI_SELECT'];

export class CreateCustomFieldUseCase {
  constructor(
    private boardsRepository: BoardsRepository,
    private boardCustomFieldsRepository: BoardCustomFieldsRepository,
  ) {}

  async execute(
    request: CreateCustomFieldRequest,
  ): Promise<CreateCustomFieldResponse> {
    const { tenantId, boardId, name, type, options, isRequired } = request;

    const board = await this.boardsRepository.findById(boardId, tenantId);

    if (!board) {
      throw new ResourceNotFoundError('Board not found');
    }

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('Custom field name is required');
    }

    if (TYPES_REQUIRING_OPTIONS.includes(type)) {
      const optionChoices = options?.choices;

      if (
        !optionChoices ||
        !Array.isArray(optionChoices) ||
        optionChoices.length === 0
      ) {
        throw new BadRequestError(
          `Custom field type ${type} requires at least one option in choices`,
        );
      }
    }

    const existingFields =
      await this.boardCustomFieldsRepository.findByBoardId(boardId);

    const nextPosition = existingFields.length;

    const customField = await this.boardCustomFieldsRepository.create({
      boardId,
      name: name.trim(),
      type,
      options: options ?? null,
      position: nextPosition,
      isRequired: isRequired ?? false,
    });

    return { customField };
  }
}
