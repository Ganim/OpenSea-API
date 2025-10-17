import { PrismaCommentsRepository } from '@/repositories/sales/prisma/prisma-comments-repository';
import { UpdateCommentUseCase } from '../update-comment';

export function makeUpdateCommentUseCase() {
  const commentsRepository = new PrismaCommentsRepository();
  return new UpdateCommentUseCase(commentsRepository);
}
