import { PrismaKudosRepliesRepository } from '@/repositories/hr/prisma/prisma-kudos-replies-repository';
import { UpdateKudosReplyUseCase } from '../update-kudos-reply';

export function makeUpdateKudosReplyUseCase(): UpdateKudosReplyUseCase {
  return new UpdateKudosReplyUseCase(new PrismaKudosRepliesRepository());
}
