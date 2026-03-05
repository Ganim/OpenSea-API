export interface CommentReactionRecord {
  id: string;
  commentId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface CreateCommentReactionSchema {
  commentId: string;
  userId: string;
  emoji: string;
}

export interface CommentReactionsRepository {
  create(data: CreateCommentReactionSchema): Promise<CommentReactionRecord>;
  findByCommentId(commentId: string): Promise<CommentReactionRecord[]>;
  findByCommentUserEmoji(
    commentId: string,
    userId: string,
    emoji: string,
  ): Promise<CommentReactionRecord | null>;
  delete(id: string): Promise<void>;
}
