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
        isSystem: data.isSystem ?? false,
        interestRate: data.interestRate,
        penaltyRate: data.penaltyRate,
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

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<FinanceCategory | null> {
    const category = await prisma.financeCategory.findFirst({
      where: {
        name,
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

  async findByParentId(
    parentId: UniqueEntityID,
    tenantId: string,
  ): Promise<FinanceCategory[]> {
    const categories = await prisma.financeCategory.findMany({
      where: {
        parentId: parentId.toString(),
        tenantId,
        deletedAt: null,
      },
    });
    return categories.map(financeCategoryPrismaToDomain);
  }

  async countEntriesByCategoryId(
    categoryId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.financeEntry.count({
      where: {
        categoryId,
        tenantId,
        deletedAt: null,
      },
    });
  }

  async migrateEntries(
    fromCategoryId: string,
    toCategoryId: string,
    tenantId: string,
  ): Promise<void> {
    await prisma.financeEntry.updateMany({
      where: {
        categoryId: fromCategoryId,
        tenantId,
        deletedAt: null,
      },
      data: {
        categoryId: toCategoryId,
      },
    });
  }

  async update(
    data: UpdateFinanceCategorySchema,
  ): Promise<FinanceCategory | null> {
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.iconUrl !== undefined) updateData.iconUrl = data.iconUrl;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.type !== undefined) updateData.type = data.type as FinanceCategoryType;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.chartOfAccountId !== undefined)
      updateData.chartOfAccountId = data.chartOfAccountId;
    if (data.displayOrder !== undefined)
      updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.interestRate !== undefined)
      updateData.interestRate = data.interestRate;
    if (data.penaltyRate !== undefined)
      updateData.penaltyRate = data.penaltyRate;

    const result = await prisma.financeCategory.updateMany({
      where: {
        id: data.id.toString(),
        tenantId: data.tenantId,
        deletedAt: null,
      },
      data: updateData,
    });

    if (result.count === 0) return null;

    const category = await prisma.financeCategory.findUnique({
      where: { id: data.id.toString() },
    });

    return category ? financeCategoryPrismaToDomain(category) : null;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.financeCategory.updateMany({
      where: { id: id.toString(), tenantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
