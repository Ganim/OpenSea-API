import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Comment } from '@/entities/sales/comment';
import type { CommentsRepository } from '@/repositories/sales/comments-repository';

interface DeleteCommentUseCaseRequest {
  id: string;
  authorId: string;
}

interface DeleteCommentUseCaseResponse {
  comment: Comment;
}

export class DeleteCommentUseCase {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(
    request: DeleteCommentUseCaseRequest,
  ): Promise<DeleteCommentUseCaseResponse> {
    const { id, authorId } = request;

    const comment = await this.commentsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!comment) {
      throw new ResourceNotFoundError('Comment not found');
    }

    // Only author can delete
    if (!comment.userId.equals(new UniqueEntityID(authorId))) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    comment.delete();
    await this.commentsRepository.save(comment);

    return { comment };
  }
}
