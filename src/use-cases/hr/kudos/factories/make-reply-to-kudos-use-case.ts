import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PrismaKudosRepliesRepository } from '@/repositories/hr/prisma/prisma-kudos-replies-repository';
import { ReplyToKudosUseCase } from '../reply-to-kudos';

export function makeReplyToKudosUseCase(): ReplyToKudosUseCase {
  return new ReplyToKudosUseCase(
    new PrismaEmployeeKudosRepository(),
    new PrismaKudosRepliesRepository(),
  );
}
