import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { CareLabelInfo, Template } from '@/entities/stock/template';
import { UnitOfMeasure } from '@/entities/stock/value-objects/unit-of-measure';
import { prisma } from '@/lib/prisma';
import type {
    CreateTemplateSchema,
    TemplatesRepository,
    UpdateTemplateSchema,
} from '../templates-repository';

export class PrismaTemplatesRepository implements TemplatesRepository {
  async create(data: CreateTemplateSchema): Promise<Template> {
    const templateData = await prisma.template.create({
      data: {
        name: data.name,
        unitOfMeasure: data.unitOfMeasure.value,
        productAttributes: (data.productAttributes ?? {}) as never,
        variantAttributes: (data.variantAttributes ?? {}) as never,
        itemAttributes: (data.itemAttributes ?? {}) as never,
        careLabel: data.careLabel as never,
      },
    });

    return Template.create(
      {
        name: templateData.name,
        unitOfMeasure: UnitOfMeasure.create(templateData.unitOfMeasure),
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
        careLabel: templateData.careLabel as CareLabelInfo | undefined,
        sequentialCode: templateData.sequentialCode,
        isActive: templateData.isActive,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt ?? undefined,
      },
      new EntityID(templateData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Template | null> {
    const templateData = await prisma.template.findUnique({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!templateData) {
      return null;
    }

    return Template.create(
      {
        name: templateData.name,
        unitOfMeasure: UnitOfMeasure.create(templateData.unitOfMeasure),
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
        careLabel: templateData.careLabel as CareLabelInfo | undefined,
        sequentialCode: templateData.sequentialCode,
        isActive: templateData.isActive,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt ?? undefined,
      },
      new EntityID(templateData.id),
    );
  }

  async findByName(name: string): Promise<Template | null> {
    const templateData = await prisma.template.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });

    if (!templateData) {
      return null;
    }

    return Template.create(
      {
        name: templateData.name,
        unitOfMeasure: UnitOfMeasure.create(templateData.unitOfMeasure),
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
        careLabel: templateData.careLabel as CareLabelInfo | undefined,
        sequentialCode: templateData.sequentialCode,
        isActive: templateData.isActive,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt ?? undefined,
      },
      new EntityID(templateData.id),
    );
  }

  async findMany(): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      where: {
        deletedAt: null,
      },
    });

    return templates.map((templateData) =>
      Template.create(
        {
          name: templateData.name,
          unitOfMeasure: UnitOfMeasure.create(templateData.unitOfMeasure),
          productAttributes: templateData.productAttributes as Record<
            string,
            unknown
          >,
          variantAttributes: templateData.variantAttributes as Record<
            string,
            unknown
          >,
          itemAttributes: templateData.itemAttributes as Record<
            string,
            unknown
          >,
          careLabel: templateData.careLabel as CareLabelInfo | undefined,
          sequentialCode: templateData.sequentialCode,
          isActive: templateData.isActive,
          createdAt: templateData.createdAt,
          updatedAt: templateData.updatedAt ?? undefined,
        },
        new EntityID(templateData.id),
      ),
    );
  }

  async update(data: UpdateTemplateSchema): Promise<Template | null> {
    const templateData = await prisma.template.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        unitOfMeasure: data.unitOfMeasure?.value,
        productAttributes: data.productAttributes as never,
        variantAttributes: data.variantAttributes as never,
        itemAttributes: data.itemAttributes as never,
        careLabel: data.careLabel as never,
        isActive: data.isActive,
      },
    });

    return Template.create(
      {
        name: templateData.name,
        unitOfMeasure: UnitOfMeasure.create(templateData.unitOfMeasure),
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
        careLabel: templateData.careLabel as CareLabelInfo | undefined,
        sequentialCode: templateData.sequentialCode,
        isActive: templateData.isActive,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt ?? undefined,
      },
      new EntityID(templateData.id),
    );
  }

  async save(template: Template): Promise<void> {
    await prisma.template.update({
      where: {
        id: template.id.toString(),
      },
      data: {
        name: template.name,
        unitOfMeasure: template.unitOfMeasure.value,
        productAttributes: template.productAttributes as never,
        variantAttributes: template.variantAttributes as never,
        itemAttributes: template.itemAttributes as never,
        careLabel: template.careLabel as never,
        isActive: template.isActive,
        updatedAt: new Date(),
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.template.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
