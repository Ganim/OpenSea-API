import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
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
        productAttributes: (data.productAttributes ?? {}) as never,
        variantAttributes: (data.variantAttributes ?? {}) as never,
        itemAttributes: (data.itemAttributes ?? {}) as never,
      },
    });

    return Template.create(
      {
        name: templateData.name,
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
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
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
        createdAt: templateData.createdAt,
        updatedAt: templateData.updatedAt ?? undefined,
      },
      new EntityID(templateData.id),
    );
  }

  async findByName(name: string): Promise<Template | null> {
    const templateData = await prisma.template.findUnique({
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
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
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
        productAttributes: data.productAttributes as never,
        variantAttributes: data.variantAttributes as never,
        itemAttributes: data.itemAttributes as never,
      },
    });

    return Template.create(
      {
        name: templateData.name,
        productAttributes: templateData.productAttributes as Record<
          string,
          unknown
        >,
        variantAttributes: templateData.variantAttributes as Record<
          string,
          unknown
        >,
        itemAttributes: templateData.itemAttributes as Record<string, unknown>,
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
        productAttributes: template.productAttributes as never,
        variantAttributes: template.variantAttributes as never,
        itemAttributes: template.itemAttributes as never,
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
