import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Tag } from '@/entities/stock/tag';
import type { Tag as PrismaTag } from '@prisma/generated/client.js';

export function mapTagPrismaToDomain(tagDb: PrismaTag) {
  return {
    id: new UniqueEntityID(tagDb.id),
    tenantId: new UniqueEntityID(tagDb.tenantId),
    name: tagDb.name,
    slug: tagDb.slug,
    color: tagDb.color,
    description: tagDb.description,
    createdAt: tagDb.createdAt,
    updatedAt: tagDb.updatedAt,
    deletedAt: tagDb.deletedAt ?? undefined,
  };
}

export function tagPrismaToDomain(tagDb: PrismaTag): Tag {
  return Tag.create(mapTagPrismaToDomain(tagDb), new UniqueEntityID(tagDb.id));
}
