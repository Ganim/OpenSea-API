import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import { prisma } from '@/lib/prisma';
import type {
  CommentsRepository,
  CreateCommentSchema,
  UpdateCommentSchema,
} from '../comments-repository';

export class PrismaCommentsRepository implements CommentsRepository {
  async create(data: CreateCommentSchema): Promise<Comment> {
    const commentData = await prisma.comment.create({
      data: {
        entityType: data.entityType.value,
        entityId: data.entityId.toString(),
        userId: data.authorId.toString(),
        content: data.content,
        parentCommentId: data.parentCommentId?.toString(),
      },
    });

    return Comment.create(
      {
        entityType: EntityType.create(commentData.entityType),
        entityId: new EntityID(commentData.entityId),
        userId: new EntityID(commentData.userId),
        content: commentData.content,
        parentCommentId: commentData.parentCommentId
          ? new EntityID(commentData.parentCommentId)
          : undefined,
        createdAt: commentData.createdAt,
        updatedAt: commentData.updatedAt,
        deletedAt: commentData.deletedAt ?? undefined,
      },
      new EntityID(commentData.id),
    );
  }

  async findById(id: UniqueEntityID): Promise<Comment | null> {
    const commentData = await prisma.comment.findFirst({
      where: {
        id: id.toString(),
        deletedAt: null,
      },
    });

    if (!commentData) return null;

    return Comment.create(
      {
        entityType: EntityType.create(commentData.entityType),
        entityId: new EntityID(commentData.entityId),
        userId: new EntityID(commentData.userId),
        content: commentData.content,
        parentCommentId: commentData.parentCommentId
          ? new EntityID(commentData.parentCommentId)
          : undefined,
        createdAt: commentData.createdAt,
        updatedAt: commentData.updatedAt,
        deletedAt: commentData.deletedAt ?? undefined,
      },
      new EntityID(commentData.id),
    );
  }

  async findManyByEntity(
    entityType: EntityType,
    entityId: UniqueEntityID,
  ): Promise<Comment[]> {
    const commentsData = await prisma.comment.findMany({
      where: {
        entityType: entityType.value,
        entityId: entityId.toString(),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return commentsData.map((commentData) =>
      Comment.create(
        {
          entityType: EntityType.create(commentData.entityType),
          entityId: new EntityID(commentData.entityId),
          userId: new EntityID(commentData.userId),
          content: commentData.content,
          parentCommentId: commentData.parentCommentId
            ? new EntityID(commentData.parentCommentId)
            : undefined,
          createdAt: commentData.createdAt,
          updatedAt: commentData.updatedAt,
          deletedAt: commentData.deletedAt ?? undefined,
        },
        new EntityID(commentData.id),
      ),
    );
  }

  async findManyByAuthor(authorId: UniqueEntityID): Promise<Comment[]> {
    const commentsData = await prisma.comment.findMany({
      where: {
        userId: authorId.toString(),
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return commentsData.map((commentData) =>
      Comment.create(
        {
          entityType: EntityType.create(commentData.entityType),
          entityId: new EntityID(commentData.entityId),
          userId: new EntityID(commentData.userId),
          content: commentData.content,
          parentCommentId: commentData.parentCommentId
            ? new EntityID(commentData.parentCommentId)
            : undefined,
          createdAt: commentData.createdAt,
          updatedAt: commentData.updatedAt,
          deletedAt: commentData.deletedAt ?? undefined,
        },
        new EntityID(commentData.id),
      ),
    );
  }

  async findReplies(parentCommentId: UniqueEntityID): Promise<Comment[]> {
    const commentsData = await prisma.comment.findMany({
      where: {
        parentCommentId: parentCommentId.toString(),
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return commentsData.map((commentData) =>
      Comment.create(
        {
          entityType: EntityType.create(commentData.entityType),
          entityId: new EntityID(commentData.entityId),
          userId: new EntityID(commentData.userId),
          content: commentData.content,
          parentCommentId: commentData.parentCommentId
            ? new EntityID(commentData.parentCommentId)
            : undefined,
          createdAt: commentData.createdAt,
          updatedAt: commentData.updatedAt,
          deletedAt: commentData.deletedAt ?? undefined,
        },
        new EntityID(commentData.id),
      ),
    );
  }

  async update(data: UpdateCommentSchema): Promise<Comment | null> {
    try {
      const commentData = await prisma.comment.update({
        where: { id: data.id.toString() },
        data: {
          content: data.content,
        },
      });

      return Comment.create(
        {
          entityType: EntityType.create(commentData.entityType),
          entityId: new EntityID(commentData.entityId),
          userId: new EntityID(commentData.userId),
          content: commentData.content,
          parentCommentId: commentData.parentCommentId
            ? new EntityID(commentData.parentCommentId)
            : undefined,
          createdAt: commentData.createdAt,
          updatedAt: commentData.updatedAt,
          deletedAt: commentData.deletedAt ?? undefined,
        },
        new EntityID(commentData.id),
      );
    } catch {
      return null;
    }
  }

  async save(comment: Comment): Promise<void> {
    await prisma.comment.upsert({
      where: { id: comment.id.toString() },
      create: {
        id: comment.id.toString(),
        entityType: comment.entityType.value,
        entityId: comment.entityId.toString(),
        userId: comment.userId.toString(),
        content: comment.content,
        parentCommentId: comment.parentCommentId?.toString(),
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt ?? new Date(),
        deletedAt: comment.deletedAt,
      },
      update: {
        content: comment.content,
        updatedAt: comment.updatedAt ?? new Date(),
        deletedAt: comment.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.comment.update({
      where: { id: id.toString() },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
