import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Comment } from '@/entities/sales/comment';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import {
  commentToDTO,
  type CommentDTO,
} from '@/mappers/sales/comment/comment-to-dto';
import type { CommentsRepository } from '@/repositories/sales/comments-repository';

interface ListCommentsUseCaseRequest {
  entityType?: string;
  entityId?: string;
  authorId?: string;
}

interface ListCommentsUseCaseResponse {
  comments: CommentDTO[];
}

export class ListCommentsUseCase {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(
    request: ListCommentsUseCaseRequest,
  ): Promise<ListCommentsUseCaseResponse> {
    const { entityType, entityId, authorId } = request;

    let comments: Comment[];

    if (entityType && entityId) {
      comments = await this.commentsRepository.findManyByEntity(
        EntityType.create(entityType),
        new UniqueEntityID(entityId),
      );
    } else if (authorId) {
      comments = await this.commentsRepository.findManyByAuthor(
        new UniqueEntityID(authorId),
      );
    } else {
      // Return empty if no filter provided
      comments = [];
    }

    return { comments: comments.map(commentToDTO) };
  }
}
