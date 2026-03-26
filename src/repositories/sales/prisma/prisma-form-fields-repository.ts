import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { FormField } from '@/entities/sales/form-field';
import { prisma } from '@/lib/prisma';
import type { FormFieldType } from '@prisma/generated/client.js';
import type {
  CreateFormFieldSchema,
  FormFieldsRepository,
} from '../form-fields-repository';

function mapToDomain(data: Record<string, unknown>): FormField {
  return FormField.create(
    {
      formId: new EntityID(data.formId as string),
      label: data.label as string,
      type: data.type as string,
      options: (data.options as Record<string, unknown>) ?? undefined,
      isRequired: data.isRequired as boolean,
      order: data.order as number,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaFormFieldsRepository implements FormFieldsRepository {
  async create(data: CreateFormFieldSchema): Promise<FormField> {
    const fieldData = await prisma.formField.create({
      data: {
        formId: data.formId,
        label: data.label,
        type: data.type as FormFieldType,
        options:
          (data.options as unknown as import('@prisma/generated/client.js').Prisma.InputJsonValue) ??
          undefined,
        isRequired: data.isRequired ?? false,
        order: data.order,
      },
    });

    return mapToDomain(fieldData as unknown as Record<string, unknown>);
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
    const fieldsData = await prisma.formField.findMany({
      where: { formId: formId.toString() },
      orderBy: { order: 'asc' },
    });

    return fieldsData.map((fieldData) =>
      mapToDomain(fieldData as unknown as Record<string, unknown>),
    );
  }

  async deleteByFormId(formId: UniqueEntityID): Promise<void> {
    await prisma.formField.deleteMany({
      where: { formId: formId.toString() },
    });
  }
}
