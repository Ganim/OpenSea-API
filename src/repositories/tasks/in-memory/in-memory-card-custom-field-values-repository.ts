import { randomUUID } from 'node:crypto';
import type {
  CardCustomFieldValuesRepository,
  CardCustomFieldValueRecord,
  SetCardCustomFieldValueSchema,
} from '../card-custom-field-values-repository';

export class InMemoryCardCustomFieldValuesRepository
  implements CardCustomFieldValuesRepository
{
  public items: CardCustomFieldValueRecord[] = [];

  async setValues(
    cardId: string,
    values: SetCardCustomFieldValueSchema[],
  ): Promise<CardCustomFieldValueRecord[]> {
    const updatedRecords: CardCustomFieldValueRecord[] = [];

    for (const valueSchema of values) {
      const existingIndex = this.items.findIndex(
        (record) =>
          record.cardId === cardId && record.fieldId === valueSchema.fieldId,
      );

      if (existingIndex >= 0) {
        this.items[existingIndex].value = valueSchema.value;
        updatedRecords.push(this.items[existingIndex]);
      } else {
        const newRecord: CardCustomFieldValueRecord = {
          id: randomUUID(),
          cardId,
          fieldId: valueSchema.fieldId,
          value: valueSchema.value,
        };
        this.items.push(newRecord);
        updatedRecords.push(newRecord);
      }
    }

    return updatedRecords;
  }

  async findByCardId(cardId: string): Promise<CardCustomFieldValueRecord[]> {
    return this.items.filter((record) => record.cardId === cardId);
  }

  async deleteByFieldId(fieldId: string): Promise<void> {
    this.items = this.items.filter((record) => record.fieldId !== fieldId);
  }
}
