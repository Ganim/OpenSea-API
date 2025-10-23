import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EntityType } from '@/entities/sales/value-objects/entity-type';
import {
  commentToDTO,
  type CommentDTO,
} from '@/mappers/sales/comment/comment-to-dto';
import type { CommentsRepository } from '@/repositories/sales/comments-repository';

interface CreateCommentUseCaseRequest {
  entityType: string;
  entityId: string;
  authorId: string;
  content: string;
  parentCommentId?: string;
}

interface CreateCommentUseCaseResponse {
  comment: CommentDTO;
}

export class CreateCommentUseCase {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(
    request: CreateCommentUseCaseRequest,
  ): Promise<CreateCommentUseCaseResponse> {
    const { entityType, entityId, authorId, content, parentCommentId } =
      request;

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Comment content is required');
    }

    if (content.length > 5000) {
      throw new BadRequestError(
        'Comment content must be at most 5000 characters',
      );
    }

    // Validate entity type
    const validEntityTypes = ['CUSTOMER', 'PRODUCT', 'SALES_ORDER'];
    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestError(
        `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`,
      );
    }

    // If it's a reply, validate parent comment exists
    let parentCommentIdEntity: UniqueEntityID | undefined;
    if (parentCommentId) {
      const parentComment = await this.commentsRepository.findById(
        new UniqueEntityID(parentCommentId),
      );

      if (!parentComment) {
        throw new ResourceNotFoundError('Parent comment not found');
      }

      // Ensure the reply is for the same entity
      if (
        !parentComment.entityId.equals(new UniqueEntityID(entityId)) ||
        parentComment.entityType.value !== entityType
      ) {
        throw new BadRequestError(
          'Reply must be for the same entity as parent comment',
        );
      }

      parentCommentIdEntity = new UniqueEntityID(parentCommentId);
    }

    // Create the comment
    const comment = await this.commentsRepository.create({
      entityType: EntityType.create(entityType),
      entityId: new UniqueEntityID(entityId),
      authorId: new UniqueEntityID(authorId),
      content: content.trim(),
      parentCommentId: parentCommentIdEntity,
    });

    return { comment: commentToDTO(comment) };
  }
}
