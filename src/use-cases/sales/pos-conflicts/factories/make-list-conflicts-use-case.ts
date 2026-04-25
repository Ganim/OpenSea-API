import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosOrderConflictsRepository } from '@/repositories/sales/prisma/prisma-pos-order-conflicts-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';

import { ListConflictsUseCase } from '../list-conflicts';

export function makeListConflictsUseCase(): ListConflictsUseCase {
  return new ListConflictsUseCase(
    new PrismaPosOrderConflictsRepository(),
    new PrismaPosTerminalsRepository(),
    new PrismaEmployeesRepository(),
  );
}
