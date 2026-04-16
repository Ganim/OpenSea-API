import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PrismaKudosReactionsRepository } from '@/repositories/hr/prisma/prisma-kudos-reactions-repository';
import { PrismaKudosRepliesRepository } from '@/repositories/hr/prisma/prisma-kudos-replies-repository';
import { ListKudosFeedUseCase } from '../list-kudos-feed';

export function makeListKudosFeedUseCase(): ListKudosFeedUseCase {
  return new ListKudosFeedUseCase(
    new PrismaEmployeeKudosRepository(),
    new PrismaKudosReactionsRepository(),
    new PrismaKudosRepliesRepository(),
  );
}
