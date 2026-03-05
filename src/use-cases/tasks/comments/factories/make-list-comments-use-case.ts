import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { ListCommentsUseCase } from '../list-comments';

export function makeListCommentsUseCase() {
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  return new ListCommentsUseCase(cardCommentsRepository);
}
