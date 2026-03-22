import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  BoardCustomFieldsRepository,
  BoardCustomFieldRecord,
} from '@/repositories/tasks/board-custom-fields-repository';
import type { CardActivitiesRepository } from '@/repositories/tasks/card-activities-repository';
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
  userId: string;
  userName: string;
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
    private cardActivitiesRepository: CardActivitiesRepository,
  ) {}

  async execute(
    request: SetCardCustomFieldValuesRequest,
  ): Promise<SetCardCustomFieldValuesResponse> {
    const { boardId, cardId, userId, userName, values } = request;

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
        throw new BadRequestError(`O campo "${field.name}" é obrigatório`);
      }
    }

    const valuesToSet = values.map((fv) => ({
      cardId,
      fieldId: fv.fieldId,
      value: fv.value,
    }));

    const fieldValues = await this.cardCustomFieldValuesRepository.setValues(
      cardId,
      valuesToSet,
    );

    for (const fv of values) {
      const field = fieldMap.get(fv.fieldId);
      if (field) {
        await this.cardActivitiesRepository.create({
          cardId,
          boardId,
          userId,
          type: 'FIELD_CHANGED',
          description: `${userName} alterou o campo personalizado "${field.name}" no cartão ${card.title}`,
          field: `customField:${field.name}`,
          newValue: fv.value as string,
        });
      }
    }

    return { fieldValues };
  }

  private validateFieldValue(
    field: BoardCustomFieldRecord,
    value: unknown,
  ): void {
    if (value === null || value === undefined) {
      if (field.isRequired) {
        throw new BadRequestError(
          `O campo "${field.name}" é obrigatório e não pode estar vazio`,
        );
      }
      return;
    }

    switch (field.type) {
      case 'TEXT': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `O campo "${field.name}" espera um valor de texto`,
          );
        }
        break;
      }
      case 'NUMBER': {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (typeof num !== 'number' || isNaN(num)) {
          throw new BadRequestError(
            `O campo "${field.name}" espera um valor numérico`,
          );
        }
        break;
      }
      case 'CHECKBOX': {
        if (
          typeof value !== 'boolean' &&
          value !== 'true' &&
          value !== 'false'
        ) {
          throw new BadRequestError(
            `O campo "${field.name}" espera um valor booleano (verdadeiro ou falso)`,
          );
        }
        break;
      }
      case 'SELECT': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `O campo "${field.name}" espera um valor de texto`,
          );
        }
        const selectChoices = (field.options?.choices ?? []) as string[];
        if (!selectChoices.includes(value)) {
          throw new BadRequestError(
            `O valor "${value}" não é uma opção válida para o campo "${field.name}"`,
          );
        }
        break;
      }
      case 'MULTI_SELECT': {
        if (!Array.isArray(value)) {
          throw new BadRequestError(
            `O campo "${field.name}" espera uma lista de valores`,
          );
        }
        const multiChoices = (field.options?.choices ?? []) as string[];
        for (const selectedValue of value) {
          if (!multiChoices.includes(selectedValue as string)) {
            throw new BadRequestError(
              `O valor "${selectedValue}" não é uma opção válida para o campo "${field.name}"`,
            );
          }
        }
        break;
      }
      case 'DATE': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `O campo "${field.name}" espera uma data em formato texto`,
          );
        }
        const parsed = Date.parse(value);
        if (isNaN(parsed)) {
          throw new BadRequestError(
            `O campo "${field.name}" contém uma data inválida`,
          );
        }
        break;
      }
      case 'URL': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `O campo "${field.name}" espera uma URL em formato texto`,
          );
        }
        try {
          new URL(value);
        } catch {
          throw new BadRequestError(
            `O campo "${field.name}" contém uma URL inválida`,
          );
        }
        break;
      }
      case 'EMAIL': {
        if (typeof value !== 'string') {
          throw new BadRequestError(
            `O campo "${field.name}" espera um endereço de e-mail`,
          );
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          throw new BadRequestError(
            `O campo "${field.name}" contém um endereço de e-mail inválido`,
          );
        }
        break;
      }
    }
  }
}
