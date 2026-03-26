import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FormField } from '@/entities/sales/form-field';

export interface CreateFormFieldSchema {
  formId: string;
  label: string;
  type: string;
  options?: Record<string, unknown>;
  isRequired?: boolean;
  order: number;
}

export interface FormFieldsRepository {
  create(data: CreateFormFieldSchema): Promise<FormField>;
  createMany(fields: CreateFormFieldSchema[]): Promise<FormField[]>;
  findByFormId(formId: UniqueEntityID): Promise<FormField[]>;
  deleteByFormId(formId: UniqueEntityID): Promise<void>;
}
