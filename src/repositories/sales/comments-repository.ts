import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';

export interface CreateCommentSchema {
  entityType: EntityType;
  entityId: UniqueEntityID;
  authorId: UniqueEntityID;
  content: string;
  parentCommentId?: UniqueEntityID;
}

export interface UpdateCommentSchema {
  id: UniqueEntityID;
  content?: string;
}

export interface CommentsRepository {
  create(data: CreateCommentSchema): Promise<Comment>;
  findById(id: UniqueEntityID): Promise<Comment | null>;
  findManyByEntity(
    entityType: EntityType,
    entityId: UniqueEntityID,
  ): Promise<Comment[]>;
  findManyByAuthor(authorId: UniqueEntityID): Promise<Comment[]>;
  findReplies(parentCommentId: UniqueEntityID): Promise<Comment[]>;
  update(data: UpdateCommentSchema): Promise<Comment | null>;
  save(comment: Comment): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
