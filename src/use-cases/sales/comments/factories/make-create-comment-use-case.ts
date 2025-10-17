import { PrismaCommentsRepository } from '@/repositories/sales/prisma/prisma-comments-repository';
import { CreateCommentUseCase } from '../create-comment';

export function makeCreateCommentUseCase() {
  const commentsRepository = new PrismaCommentsRepository();
  return new CreateCommentUseCase(commentsRepository);
}
