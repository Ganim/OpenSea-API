import { PrismaCommentsRepository } from '@/repositories/sales/prisma/prisma-comments-repository';
import { DeleteCommentUseCase } from '../delete-comment';

export function makeDeleteCommentUseCase() {
  const commentsRepository = new PrismaCommentsRepository();
  return new DeleteCommentUseCase(commentsRepository);
}
