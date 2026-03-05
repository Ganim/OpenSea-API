export interface CardCommentRecord {
  id: string;
  cardId: string;
  authorId: string;
  content: string;
  mentions: string[] | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  authorName?: string | null;
  authorEmail?: string | null;
}

export interface CreateCardCommentSchema {
  cardId: string;
  authorId: string;
  content: string;
  mentions?: string[] | null;
}

export interface UpdateCardCommentSchema {
  id: string;
  cardId: string;
  content: string;
  mentions?: string[] | null;
}

export interface FindManyCardCommentsOptions {
  cardId: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface FindManyCardCommentsResult {
  comments: CardCommentRecord[];
  total: number;
}

export interface CardCommentsRepository {
  create(data: CreateCardCommentSchema): Promise<CardCommentRecord>;
  findById(id: string, cardId: string): Promise<CardCommentRecord | null>;
  findByCardId(
    options: FindManyCardCommentsOptions,
  ): Promise<FindManyCardCommentsResult>;
  update(data: UpdateCardCommentSchema): Promise<CardCommentRecord | null>;
  softDelete(id: string, cardId: string): Promise<void>;
}
