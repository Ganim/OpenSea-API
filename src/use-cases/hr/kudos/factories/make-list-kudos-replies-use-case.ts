import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PrismaKudosRepliesRepository } from '@/repositories/hr/prisma/prisma-kudos-replies-repository';
import { ListKudosRepliesUseCase } from '../list-kudos-replies';

export function makeListKudosRepliesUseCase(): ListKudosRepliesUseCase {
  return new ListKudosRepliesUseCase(
    new PrismaEmployeeKudosRepository(),
    new PrismaKudosRepliesRepository(),
  );
}
