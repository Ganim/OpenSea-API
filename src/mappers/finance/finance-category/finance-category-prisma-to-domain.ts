import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceCategory } from '@/entities/finance/finance-category';
import type { FinanceCategory as PrismaFinanceCategory } from '@prisma/generated/client.js';

export function mapFinanceCategoryPrismaToDomain(data: PrismaFinanceCategory) {
  return {
    id: new UniqueEntityID(data.id),
    tenantId: new UniqueEntityID(data.tenantId),
    name: data.name,
    slug: data.slug,
    description: data.description ?? undefined,
    iconUrl: data.iconUrl ?? undefined,
    color: data.color ?? undefined,
    type: data.type,
    parentId: data.parentId ? new UniqueEntityID(data.parentId) : undefined,
    displayOrder: data.displayOrder,
    isActive: data.isActive,
    isSystem: data.isSystem,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    deletedAt: data.deletedAt ?? undefined,
  };
}

export function financeCategoryPrismaToDomain(
  data: PrismaFinanceCategory,
): FinanceCategory {
  return FinanceCategory.create(
    mapFinanceCategoryPrismaToDomain(data),
    new UniqueEntityID(data.id),
  );
}
