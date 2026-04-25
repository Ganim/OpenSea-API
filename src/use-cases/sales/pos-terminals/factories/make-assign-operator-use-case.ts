import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';

import { AssignOperatorUseCase } from '../assign-operator';

export function makeAssignOperatorUseCase(): AssignOperatorUseCase {
  return new AssignOperatorUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaEmployeesRepository(),
    new PrismaPosTerminalOperatorsRepository(),
  );
}
