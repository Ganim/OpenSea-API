import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { DeleteCommentUseCase } from '../delete-comment';

export function makeDeleteCommentUseCase() {
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  return new DeleteCommentUseCase(cardCommentsRepository);
}
