import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { LabelTemplate } from '@/entities/core/label-template';
import { prisma } from '@/lib/prisma';
import { labelTemplatePrismaToDomain } from '@/mappers/core/label-template/label-template-prisma-to-domain';
import type {
  CreateLabelTemplateSchema,
  LabelTemplatesRepository,
  ListLabelTemplatesFilters,
  ListLabelTemplatesResult,
  UpdateLabelTemplateSchema,
} from '../label-templates-repository';

export class PrismaLabelTemplatesRepository
  implements LabelTemplatesRepository
{
  async create(data: CreateLabelTemplateSchema): Promise<LabelTemplate> {
    const labelTemplateData = await prisma.labelTemplate.create({
      data: {
        name: data.name,
        description: data.description,
        isSystem: data.isSystem ?? false,
        width: data.width,
        height: data.height,
        grapesJsData: data.grapesJsData,
        compiledHtml: data.compiledHtml,
        compiledCss: data.compiledCss,
        thumbnailUrl: data.thumbnailUrl,
        tenantId: data.tenantId.toString(),
        createdById: data.createdById.toString(),
      },
    });

    return labelTemplatePrismaToDomain(labelTemplateData);
  }

  async findById(
    tenantId: UniqueEntityID,
    id: UniqueEntityID,
  ): Promise<LabelTemplate | null> {
    const labelTemplateData = await prisma.labelTemplate.findFirst({
      where: {
        id: id.toString(),
        OR: [{ tenantId: tenantId.toString() }, { isSystem: true }],
        deletedAt: null,
      },
    });

    if (!labelTemplateData) {
      return null;
    }

    return labelTemplatePrismaToDomain(labelTemplateData);
  }

  async findByNameAndTenant(
    name: string,
    tenantId: UniqueEntityID,
  ): Promise<LabelTemplate | null> {
    const labelTemplateData = await prisma.labelTemplate.findFirst({
      where: {
        name,
        tenantId: tenantId.toString(),
        deletedAt: null,
      },
    });

    if (!labelTemplateData) {
      return null;
    }

    return labelTemplatePrismaToDomain(labelTemplateData);
  }

  async findMany(
    filters: ListLabelTemplatesFilters,
  ): Promise<ListLabelTemplatesResult> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;
    const skip = (page - 1) * limit;

    const whereCondition = {
      deletedAt: null,
      OR: [
        { tenantId: filters.tenantId.toString() },
        ...(filters.includeSystem !== false ? [{ isSystem: true }] : []),
      ],
      ...(filters.search
        ? {
            AND: {
              OR: [
                {
                  name: {
                    contains: filters.search,
                    mode: 'insensitive' as const,
                  },
                },
                {
                  description: {
                    contains: filters.search,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            },
          }
        : {}),
    };

    const [templates, total] = await Promise.all([
      prisma.labelTemplate.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.labelTemplate.count({
        where: whereCondition,
      }),
    ]);

    return {
      templates: templates.map(labelTemplatePrismaToDomain),
      total,
    };
  }

  async findSystemTemplates(): Promise<LabelTemplate[]> {
    const templates = await prisma.labelTemplate.findMany({
      where: {
        isSystem: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return templates.map(labelTemplatePrismaToDomain);
  }

  async update(data: UpdateLabelTemplateSchema): Promise<LabelTemplate | null> {
    const existing = await prisma.labelTemplate.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existing || existing.isSystem) {
      return null;
    }

    const labelTemplateData = await prisma.labelTemplate.update({
      where: {
        id: data.id.toString(),
      },
      data: {
        name: data.name,
        description: data.description,
        width: data.width,
        height: data.height,
        grapesJsData: data.grapesJsData,
        compiledHtml: data.compiledHtml,
        compiledCss: data.compiledCss,
        thumbnailUrl: data.thumbnailUrl,
      },
    });

    return labelTemplatePrismaToDomain(labelTemplateData);
  }

  async save(labelTemplate: LabelTemplate): Promise<void> {
    await prisma.labelTemplate.update({
      where: {
        id: labelTemplate.id.toString(),
      },
      data: {
        name: labelTemplate.name,
        description: labelTemplate.description,
        width: labelTemplate.width,
        height: labelTemplate.height,
        grapesJsData: labelTemplate.grapesJsData,
        compiledHtml: labelTemplate.compiledHtml,
        compiledCss: labelTemplate.compiledCss,
        thumbnailUrl: labelTemplate.thumbnailUrl,
        updatedAt: new Date(),
      },
    });
  }

  async delete(tenantId: UniqueEntityID, id: UniqueEntityID): Promise<void> {
    const existing = await prisma.labelTemplate.findFirst({
      where: {
        id: id.toString(),
        tenantId: tenantId.toString(),
        deletedAt: null,
      },
    });

    if (!existing || existing.isSystem) {
      return;
    }

    await prisma.labelTemplate.update({
      where: {
        id: id.toString(),
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
