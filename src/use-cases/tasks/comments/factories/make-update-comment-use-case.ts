import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { UpdateCommentUseCase } from '../update-comment';

export function makeUpdateCommentUseCase() {
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  return new UpdateCommentUseCase(cardCommentsRepository);
}
