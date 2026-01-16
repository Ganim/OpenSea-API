import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
import { prisma } from '@/lib/prisma';
import { templatePrismaToDomain } from '@/mappers/stock/template/template-prisma-to-domain';
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
        iconUrl: data.iconUrl,
        unitOfMeasure: data.unitOfMeasure.value,
        productAttributes: (data.productAttributes ?? {}) as never,
        variantAttributes: (data.variantAttributes ?? {}) as never,
        itemAttributes: (data.itemAttributes ?? {}) as never,
        careLabel: data.careLabel as never,
      },
    });

    return templatePrismaToDomain(templateData);
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

    return templatePrismaToDomain(templateData);
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

    return templatePrismaToDomain(templateData);
  }

  async findMany(): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      where: {
        deletedAt: null,
      },
    });

    return templates.map(templatePrismaToDomain);
  }

  async update(data: UpdateTemplateSchema): Promise<Template | null> {
    const templateData = await prisma.template.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        iconUrl: data.iconUrl,
        unitOfMeasure: data.unitOfMeasure?.value,
        productAttributes: data.productAttributes as never,
        variantAttributes: data.variantAttributes as never,
        itemAttributes: data.itemAttributes as never,
        careLabel: data.careLabel as never,
        isActive: data.isActive,
      },
    });

    return templatePrismaToDomain(templateData);
  }

  async save(template: Template): Promise<void> {
    await prisma.template.update({
      where: {
        id: template.id.toString(),
      },
      data: {
        name: template.name,
        iconUrl: template.iconUrl,
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
