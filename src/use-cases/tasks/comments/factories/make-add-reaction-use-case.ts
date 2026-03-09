import { PrismaCardCommentsRepository } from '@/repositories/tasks/prisma/prisma-card-comments-repository';
import { PrismaCommentReactionsRepository } from '@/repositories/tasks/prisma/prisma-comment-reactions-repository';
import { AddReactionUseCase } from '../add-reaction';

export function makeAddReactionUseCase() {
  const cardCommentsRepository = new PrismaCardCommentsRepository();
  const commentReactionsRepository = new PrismaCommentReactionsRepository();
  return new AddReactionUseCase(
    cardCommentsRepository,
    commentReactionsRepository,
  );
}
