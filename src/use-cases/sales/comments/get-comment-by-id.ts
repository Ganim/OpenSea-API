import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Comment } from '@/entities/sales/comment';
import type { CommentsRepository } from '@/repositories/sales/comments-repository';

interface GetCommentByIdUseCaseRequest {
  id: string;
}

interface GetCommentByIdUseCaseResponse {
  comment: Comment;
}

export class GetCommentByIdUseCase {
  constructor(private commentsRepository: CommentsRepository) {}

  async execute(
    request: GetCommentByIdUseCaseRequest,
  ): Promise<GetCommentByIdUseCaseResponse> {
    const { id } = request;

    const comment = await this.commentsRepository.findById(
      new UniqueEntityID(id),
    );

    if (!comment) {
      throw new ResourceNotFoundError('Comment not found');
    }

    return { comment };
  }
}
