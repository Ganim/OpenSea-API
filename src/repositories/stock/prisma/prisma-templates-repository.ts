import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Template } from '@/entities/stock/template';
import { prisma } from '@/lib/prisma';
import { templatePrismaToDomain } from '@/mappers/stock/template/template-prisma-to-domain';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type { Prisma } from '@prisma/generated/client';
import type {
  CreateTemplateSchema,
  TemplatesRepository,
  UpdateTemplateSchema,
} from '../templates-repository';

export class PrismaTemplatesRepository implements TemplatesRepository {
  async create(data: CreateTemplateSchema): Promise<Template> {
    const templateData = await prisma.template.create({
      data: {
        tenantId: data.tenantId,
        code: data.code, // Código hierárquico manual (auto-gerado no use case se não fornecido)
        name: data.name,
        iconUrl: data.iconUrl,
        unitOfMeasure: data.unitOfMeasure.value,
        productAttributes: (data.productAttributes ?? {}) as never,
        variantAttributes: (data.variantAttributes ?? {}) as never,
        itemAttributes: (data.itemAttributes ?? {}) as never,
        specialModules: data.specialModules ?? [],
      },
    });

    return templatePrismaToDomain(templateData);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Template | null> {
    const templateData = await prisma.template.findUnique({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!templateData) {
      return null;
    }

    return templatePrismaToDomain(templateData);
  }

  async findByName(name: string, tenantId: string): Promise<Template | null> {
    const templateData = await prisma.template.findFirst({
      where: {
        name,
        tenantId,
        deletedAt: null,
      },
    });

    if (!templateData) {
      return null;
    }

    return templatePrismaToDomain(templateData);
  }

  async findMany(tenantId: string): Promise<Template[]> {
    const templates = await prisma.template.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
    });

    return templates.map(templatePrismaToDomain);
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams & {
      search?: string;
      sortBy?: 'name' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedResult<Template>> {
    const where: Prisma.TemplateWhereInput = {
      tenantId,
      deletedAt: null,
      ...(params.search && {
        name: { contains: params.search, mode: 'insensitive' as const },
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        orderBy: {
          [params.sortBy ?? 'name']: params.sortOrder ?? 'asc',
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.template.count({ where }),
    ]);

    return {
      data: templates.map(templatePrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
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
        specialModules: data.specialModules,
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
        specialModules: template.specialModules,
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
