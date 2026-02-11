import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceCategory } from '@/entities/finance/finance-category';
import { financeCategoryPrismaToDomain } from '@/mappers/finance/finance-category/finance-category-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  FinanceCategoriesRepository,
  CreateFinanceCategorySchema,
  UpdateFinanceCategorySchema,
} from '../finance-categories-repository';
import type { FinanceCategoryType } from '@prisma/generated/client.js';

export class PrismaFinanceCategoriesRepository
  implements FinanceCategoriesRepository
{
  async create(data: CreateFinanceCategorySchema): Promise<FinanceCategory> {
    const category = await prisma.financeCategory.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        iconUrl: data.iconUrl,
        color: data.color,
        type: data.type as FinanceCategoryType,
        parentId: data.parentId,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });

    return financeCategoryPrismaToDomain(category);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceCategory | null> {
    const category = await prisma.financeCategory.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!category) return null;
    return financeCategoryPrismaToDomain(category);
  }

  async findBySlug(
    slug: string,
    tenantId: string,
  ): Promise<FinanceCategory | null> {
    const category = await prisma.financeCategory.findFirst({
      where: {
        slug,
        tenantId,
        deletedAt: null,
      },
    });

    if (!category) return null;
    return financeCategoryPrismaToDomain(category);
  }

  async findMany(tenantId: string): Promise<FinanceCategory[]> {
    const categories = await prisma.financeCategory.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map(financeCategoryPrismaToDomain);
  }

  async update(
    data: UpdateFinanceCategorySchema,
  ): Promise<FinanceCategory | null> {
    const category = await prisma.financeCategory.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.type !== undefined && {
          type: data.type as FinanceCategoryType,
        }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.displayOrder !== undefined && {
          displayOrder: data.displayOrder,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return financeCategoryPrismaToDomain(category);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.financeCategory.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
