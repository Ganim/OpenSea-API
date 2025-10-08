import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import type { Comment as PrismaComment } from '@prisma/client';

export function mapCommentPrismaToDomain(commentDb: PrismaComment) {
  return {
    id: new UniqueEntityID(commentDb.id),
    entityType: EntityType.create(commentDb.entityType),
    entityId: new UniqueEntityID(commentDb.entityId),
    userId: new UniqueEntityID(commentDb.userId),
    content: commentDb.content,
    createdAt: commentDb.createdAt,
    updatedAt: commentDb.updatedAt,
    deletedAt: commentDb.deletedAt ?? undefined,
  };
}

export function commentPrismaToDomain(commentDb: PrismaComment): Comment {
  return Comment.create(
    mapCommentPrismaToDomain(commentDb),
    new UniqueEntityID(commentDb.id),
  );
}
