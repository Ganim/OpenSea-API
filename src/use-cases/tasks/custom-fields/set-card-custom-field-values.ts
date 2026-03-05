import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardCustomFieldsRepository,
  BoardCustomFieldRecord,
} from '@/repositories/tasks/board-custom-fields-repository';
import type {
  CardCustomFieldValuesRepository,
  CardCustomFieldValueRecord,
} from '@/repositories/tasks/card-custom-field-values-repository';
import type { CardsRepository } from '@/repositories/tasks/cards-repository';

interface FieldValueInput {
  fieldId: string;
  value: unknown;
}

interface SetCardCustomFieldValuesRequest {
  boardId: string;
  cardId: string;
  values: FieldValueInput[];
}

interface SetCardCustomFieldValuesResponse {
  fieldValues: CardCustomFieldValueRecord[];
}

export class SetCardCustomFieldValuesUseCase {
  constructor(
    private cardsRepository: CardsRepository,
    private boardCustomFieldsRepository: BoardCustomFieldsRepository,
    private cardCustomFieldValuesRepository: CardCustomFieldValuesRepository,
  ) {}

  async execute(
    request: SetCardCustomFieldValuesRequest,
  ): Promise<SetCardCustomFieldValuesResponse> {
    const { boardId, cardId, values } = request;

    const card = await this.cardsRepository.findById(cardId, boardId);

    if (!card) {
      throw new ResourceNotFoundError('Card not found');
    }

    const boardFields =
      await this.boardCustomFieldsRepository.findByBoardId(boardId);

    const fieldMap = new Map<string, BoardCustomFieldRecord>();
    for (const field of boardFields) {
      fieldMap.set(field.id, field);
    }

    for (const fieldValue of values) {
      const field = fieldMap.get(fieldValue.fieldId);

      if (!field) {
        throw new ResourceNotFoundError(
          `Custom field ${fieldValue.fieldId} not found`,
        );
      }

      this.validateFieldValue(field, fieldValue.value);
    }

    const providedFieldIds = new Set(values.map((fv) => fv.fieldId));

    for (const field of boardFields) {
      if (field.isRequired && !providedFieldIds.has(field.id)) {
        throw new BadRequestError(
          `Field "${field.name}" is required`,
        );
      }
    }

    const valuesToSet = values.map((fv) => ({
      cardId,
      fieldId: fv.fieldId,
      value: fv.value,
    }));

    const fieldValues =
      await this.cardCustomFieldValuesRepository.setValues(cardId, valuesToSet);

    return { fieldValues };
  }

  private validateFieldValue(
    field: BoardCustomFieldRecord,
    value: unknown,
  ): void {
    if (value === null || value === undefined) {
      if (field.isRequired) {
        throw new BadRequestError(
          `Field "${field.name}" is required and cannot be empty`,
        );
      }
      return;
    }

    switch (field.type) {
      case 'TEXT': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `Field "${field.name}" expects a text value`,
          );
        }
        break;
      }
      case 'NUMBER': {
        if (typeof value !== 'number') {
          throw new BadRequestError(
            `Field "${field.name}" expects a numeric value`,
          );
        }
        break;
      }
      case 'CHECKBOX': {
        if (typeof value !== 'boolean') {
          throw new BadRequestError(
            `Field "${field.name}" expects a boolean value`,
          );
        }
        break;
      }
      case 'SELECT': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `Field "${field.name}" expects a string value`,
          );
        }
        const selectChoices = (field.options?.choices ?? []) as string[];
        if (!selectChoices.includes(value)) {
          throw new BadRequestError(
            `Value "${value}" is not a valid option for field "${field.name}"`,
          );
        }
        break;
      }
      case 'MULTI_SELECT': {
        if (!Array.isArray(value)) {
          throw new BadRequestError(
            `Field "${field.name}" expects an array of values`,
          );
        }
        const multiChoices = (field.options?.choices ?? []) as string[];
        for (const selectedValue of value) {
          if (!multiChoices.includes(selectedValue as string)) {
            throw new BadRequestError(
              `Value "${selectedValue}" is not a valid option for field "${field.name}"`,
            );
          }
        }
        break;
      }
      case 'DATE': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `Field "${field.name}" expects a date string value`,
          );
        }
        break;
      }
    }
  }
}
