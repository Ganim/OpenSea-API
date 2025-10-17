import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Comment } from '@/entities/sales/comment';
import type { CommentsRepository } from '@/repositories/sales/comments-repository';

interface UpdateCommentUseCaseRequest {
  id: string;
  authorId: string;
  content: string;
}

interface UpdateCommentUseCaseResponse {
  comment: Comment;
}

export class UpdateCommentUseCase {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(
    request: UpdateCommentUseCaseRequest,
  ): Promise<UpdateCommentUseCaseResponse> {
    const { id, authorId, content } = request;

    const comment = await this.commentsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!comment) {
      throw new ResourceNotFoundError('Comment not found');
    }

    // Only author can update
    if (!comment.userId.equals(new UniqueEntityID(authorId))) {
      throw new ForbiddenError('Only the author can update this comment');
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Comment content is required');
    }

    if (content.length > 5000) {
      throw new BadRequestError(
        'Comment content must be at most 5000 characters',
      );
    }

    comment.content = content.trim();
    await this.commentsRepository.save(comment);

    return { comment };
  }
}
