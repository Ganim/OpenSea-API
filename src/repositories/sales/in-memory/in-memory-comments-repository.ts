import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import type {
  CommentsRepository,
  CreateCommentSchema,
  UpdateCommentSchema,
} from '../comments-repository';

export class InMemoryCommentsRepository implements CommentsRepository {
  public items: Comment[] = [];

  async create(data: CreateCommentSchema): Promise<Comment> {
    const comment = Comment.create({
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.authorId,
      content: data.content,
    });

    this.items.push(comment);
    return comment;
  }

  async findById(id: UniqueEntityID): Promise<Comment | null> {
    const comment = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    return comment ?? null;
  }

  async findManyByEntity(
    entityType: EntityType,
    entityId: UniqueEntityID,
  ): Promise<Comment[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.entityType.value === entityType.value &&
        item.entityId.equals(entityId),
    );
  }

  async findManyByAuthor(authorId: UniqueEntityID): Promise<Comment[]> {
    return this.items.filter(
      (item) => !item.deletedAt && item.userId.equals(authorId),
    );
  }

  async findReplies(parentCommentId: UniqueEntityID): Promise<Comment[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.parentCommentId &&
        item.parentCommentId.equals(parentCommentId),
    );
  }

  async update(data: UpdateCommentSchema): Promise<Comment | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) {
      return null;
    }

    const comment = this.items[index];

    if (data.content !== undefined) comment.content = data.content;

    return comment;
  }

  async save(comment: Comment): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(comment.id));

    if (index >= 0) {
      this.items[index] = comment;
    } else {
      this.items.push(comment);
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const comment = await this.findById(id);

    if (comment) {
      comment.delete();
    }
  }
}
