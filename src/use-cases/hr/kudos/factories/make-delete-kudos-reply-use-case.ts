import { PrismaKudosRepliesRepository } from '@/repositories/hr/prisma/prisma-kudos-replies-repository';
import { DeleteKudosReplyUseCase } from '../delete-kudos-reply';

export function makeDeleteKudosReplyUseCase(): DeleteKudosReplyUseCase {
  return new DeleteKudosReplyUseCase(new PrismaKudosRepliesRepository());
}
