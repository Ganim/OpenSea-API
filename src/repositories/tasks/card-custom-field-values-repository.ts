export interface CardCustomFieldValueRecord {
  id: string;
  cardId: string;
  fieldId: string;
  value: unknown;
}

export interface SetCardCustomFieldValueSchema {
  cardId: string;
  fieldId: string;
  value: unknown;
}

export interface CardCustomFieldValuesRepository {
  setValues(
    cardId: string,
    values: SetCardCustomFieldValueSchema[],
  ): Promise<CardCustomFieldValueRecord[]>;
  findByCardId(cardId: string): Promise<CardCustomFieldValueRecord[]>;
  deleteByFieldId(fieldId: string): Promise<void>;
}
