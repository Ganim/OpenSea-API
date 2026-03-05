import { PrismaCommentReactionsRepository } from '@/repositories/tasks/prisma/prisma-comment-reactions-repository';
import { RemoveReactionUseCase } from '../remove-reaction';

export function makeRemoveReactionUseCase() {
  const commentReactionsRepository = new PrismaCommentReactionsRepository();
  return new RemoveReactionUseCase(commentReactionsRepository);
}
