import { PrismaCommentsRepository } from '@/repositories/sales/prisma/prisma-comments-repository';
import { ListCommentsUseCase } from '../list-comments';

export function makeListCommentsUseCase() {
  const commentsRepository = new PrismaCommentsRepository();
  return new ListCommentsUseCase(commentsRepository);
}
