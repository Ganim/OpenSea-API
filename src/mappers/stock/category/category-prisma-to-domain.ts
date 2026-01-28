import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Category } from '@/entities/stock/category';
import type { Category as PrismaCategory } from '@prisma/generated/client.js';

export function mapCategoryPrismaToDomain(categoryDb: PrismaCategory) {
  return {
    id: new UniqueEntityID(categoryDb.id),
    name: categoryDb.name,
    slug: categoryDb.name.toLowerCase().replace(/\s+/g, '-'),
    description: null,
    parentId: categoryDb.parentId
      ? new UniqueEntityID(categoryDb.parentId)
      : null,
    displayOrder: 0,
    isActive: true,
    createdAt: categoryDb.createdAt,
    updatedAt: categoryDb.updatedAt,
    deletedAt: categoryDb.deletedAt ?? null,
  };
}

export function categoryPrismaToDomain(categoryDb: PrismaCategory): Category {
  return Category.create(
    mapCategoryPrismaToDomain(categoryDb),
    new UniqueEntityID(categoryDb.id),
  );
}
