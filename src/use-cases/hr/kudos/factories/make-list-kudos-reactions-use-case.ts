import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PrismaKudosReactionsRepository } from '@/repositories/hr/prisma/prisma-kudos-reactions-repository';
import { ListKudosReactionsUseCase } from '../list-kudos-reactions';

export function makeListKudosReactionsUseCase(): ListKudosReactionsUseCase {
  return new ListKudosReactionsUseCase(
    new PrismaEmployeeKudosRepository(),
    new PrismaKudosReactionsRepository(),
  );
}
