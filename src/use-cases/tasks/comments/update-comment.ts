import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  CardCommentsRepository,
  CardCommentRecord,
} from '@/repositories/tasks/card-comments-repository';

interface UpdateCommentRequest {
  tenantId: string;
  userId: string;
  commentId: string;
  cardId: string;
  content: string;
}

interface UpdateCommentResponse {
  comment: CardCommentRecord;
}

export class UpdateCommentUseCase {
  constructor(private cardCommentsRepository: CardCommentsRepository) {}

  async execute(request: UpdateCommentRequest): Promise<UpdateCommentResponse> {
    const { userId, commentId, cardId, content } = request;

    const existingComment = await this.cardCommentsRepository.findById(
      commentId,
      cardId,
    );

    if (!existingComment) {
      throw new ResourceNotFoundError('Comment not found');
    }

    if (existingComment.authorId !== userId) {
      throw new ForbiddenError('Only the comment author can edit this comment');
    }

    const updatedComment = await this.cardCommentsRepository.update({
      id: commentId,
      cardId,
      content: content.trim(),
    });

    return { comment: updatedComment! };
  }
}
