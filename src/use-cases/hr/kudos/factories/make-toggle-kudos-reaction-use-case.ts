import { PrismaEmployeeKudosRepository } from '@/repositories/hr/prisma/prisma-employee-kudos-repository';
import { PrismaKudosReactionsRepository } from '@/repositories/hr/prisma/prisma-kudos-reactions-repository';
import { ToggleKudosReactionUseCase } from '../toggle-kudos-reaction';

export function makeToggleKudosReactionUseCase(): ToggleKudosReactionUseCase {
  return new ToggleKudosReactionUseCase(
    new PrismaEmployeeKudosRepository(),
    new PrismaKudosReactionsRepository(),
  );
}
