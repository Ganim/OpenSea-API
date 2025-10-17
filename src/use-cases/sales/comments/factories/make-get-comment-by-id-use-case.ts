import { PrismaCommentsRepository } from '@/repositories/sales/prisma/prisma-comments-repository';
import { GetCommentByIdUseCase } from '../get-comment-by-id';

export function makeGetCommentByIdUseCase() {
  const commentsRepository = new PrismaCommentsRepository();
  return new GetCommentByIdUseCase(commentsRepository);
}
