import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  commentToDTO,
  type CommentDTO,
} from '@/mappers/sales/comment/comment-to-dto';
import type { CommentsRepository } from '@/repositories/sales/comments-repository';

interface GetCommentByIdUseCaseRequest {
  id: string;
}

interface GetCommentByIdUseCaseResponse {
  comment: CommentDTO;
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

    return { comment: commentToDTO(comment) };
  }
}
