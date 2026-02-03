import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Category } from '@/entities/stock/category';
import type { Category as PrismaCategory } from '@prisma/generated/client.js';

type PrismaCategoryWithCount = PrismaCategory & {
  _count?: {
    subCategories?: number;
    productCategories?: number;
  };
};

export function mapCategoryPrismaToDomain(categoryDb: PrismaCategoryWithCount) {
  return {
    id: new UniqueEntityID(categoryDb.id),
    tenantId: new UniqueEntityID(categoryDb.tenantId),
    name: categoryDb.name,
    slug: categoryDb.name.toLowerCase().replace(/\s+/g, '-'),
    description: null,
    iconUrl: categoryDb.iconUrl ?? null,
    parentId: categoryDb.parentId
      ? new UniqueEntityID(categoryDb.parentId)
      : null,
    displayOrder: 0,
    isActive: true,
    childrenCount: categoryDb._count?.subCategories ?? 0,
    productCount: categoryDb._count?.productCategories ?? 0,
    createdAt: categoryDb.createdAt,
    updatedAt: categoryDb.updatedAt,
    deletedAt: categoryDb.deletedAt ?? null,
  };
}

export function categoryPrismaToDomain(
  categoryDb: PrismaCategoryWithCount,
): Category {
  return Category.create(
    mapCategoryPrismaToDomain(categoryDb),
    new UniqueEntityID(categoryDb.id),
  );
}
