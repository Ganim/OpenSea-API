import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPosOrderConflictsRepository } from '@/repositories/sales/prisma/prisma-pos-order-conflicts-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';

import { GetConflictUseCase } from '../get-conflict';

export function makeGetConflictUseCase(): GetConflictUseCase {
  return new GetConflictUseCase(
    new PrismaPosOrderConflictsRepository(),
    new PrismaPosTerminalsRepository(),
    new PrismaEmployeesRepository(),
    new PrismaUsersRepository(),
    new PrismaVariantsRepository(),
    new PrismaOrdersRepository(),
  );
}
