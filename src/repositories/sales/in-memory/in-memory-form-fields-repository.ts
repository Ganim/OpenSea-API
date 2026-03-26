import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FormField } from '@/entities/sales/form-field';
import type {
  CreateFormFieldSchema,
  FormFieldsRepository,
} from '../form-fields-repository';

export class InMemoryFormFieldsRepository implements FormFieldsRepository {
  public items: FormField[] = [];

  async create(data: CreateFormFieldSchema): Promise<FormField> {
    const field = FormField.create({
      formId: new UniqueEntityID(data.formId),
      label: data.label,
      type: data.type,
      options: data.options,
      isRequired: data.isRequired,
      order: data.order,
    });

    this.items.push(field);
    return field;
  }

  async createMany(fields: CreateFormFieldSchema[]): Promise<FormField[]> {
    const createdFields: FormField[] = [];
    for (const fieldData of fields) {
      const field = await this.create(fieldData);
      createdFields.push(field);
    }
    return createdFields;
  }

  async findByFormId(formId: UniqueEntityID): Promise<FormField[]> {
    return this.items
      .filter((item) => item.formId.equals(formId))
      .sort((a, b) => a.order - b.order);
  }

  async deleteByFormId(formId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.formId.equals(formId));
  }
}
