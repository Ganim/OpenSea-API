import { randomUUID } from 'node:crypto';
import type {
  CardCommentsRepository,
  CardCommentRecord,
  CreateCardCommentSchema,
  UpdateCardCommentSchema,
  FindManyCardCommentsOptions,
  FindManyCardCommentsResult,
} from '../card-comments-repository';

export class InMemoryCardCommentsRepository
  implements CardCommentsRepository
{
  public items: CardCommentRecord[] = [];

  async create(data: CreateCardCommentSchema): Promise<CardCommentRecord> {
    const comment: CardCommentRecord = {
      id: randomUUID(),
      cardId: data.cardId,
      authorId: data.authorId,
      content: data.content,
      mentions: data.mentions ?? null,
      editedAt: null,
      deletedAt: null,
      createdAt: new Date(),
      authorName: null,
      authorEmail: null,
    };

    this.items.push(comment);
    return comment;
  }

  async findById(
    id: string,
    cardId: string,
  ): Promise<CardCommentRecord | null> {
    return (
      this.items.find(
        (comment) =>
          comment.id === id &&
          comment.cardId === cardId &&
          !comment.deletedAt,
      ) ?? null
    );
  }

  async findByCardId(
    options: FindManyCardCommentsOptions,
  ): Promise<FindManyCardCommentsResult> {
    const filteredComments = this.items.filter((comment) => {
      if (comment.cardId !== options.cardId) return false;
      if (!options.includeDeleted && comment.deletedAt) return false;
      return true;
    });

    const sortedComments = filteredComments.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const total = sortedComments.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const startIndex = (page - 1) * limit;
    const comments = sortedComments.slice(startIndex, startIndex + limit);

    return { comments, total };
  }

  async update(
    data: UpdateCardCommentSchema,
  ): Promise<CardCommentRecord | null> {
    const comment = this.items.find(
      (comment) =>
        comment.id === data.id &&
        comment.cardId === data.cardId &&
        !comment.deletedAt,
    );
    if (!comment) return null;

    comment.content = data.content;
    if (data.mentions !== undefined) comment.mentions = data.mentions ?? null;
    comment.editedAt = new Date();

    return comment;
  }

  async softDelete(id: string, cardId: string): Promise<void> {
    const comment = this.items.find(
      (comment) => comment.id === id && comment.cardId === cardId,
    );
    if (comment) {
      comment.deletedAt = new Date();
    }
  }
}
