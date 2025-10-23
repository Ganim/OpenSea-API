import type { Comment } from '@/entities/sales/comment';

export interface CommentDTO {
  id: string;
  entityType: string;
  entityId: string;
  userId: string;
  content: string;
  parentCommentId?: string;
  isDeleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function commentToDTO(comment: Comment): CommentDTO {
  return {
    id: comment.id.toString(),
    entityType: comment.entityType.value,
    entityId: comment.entityId.toString(),
    userId: comment.userId.toString(),
    content: comment.content,
    parentCommentId: comment.parentCommentId?.toString(),
    isDeleted: comment.isDeleted,
    isEdited: comment.isEdited,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    deletedAt: comment.deletedAt,
  };
}
