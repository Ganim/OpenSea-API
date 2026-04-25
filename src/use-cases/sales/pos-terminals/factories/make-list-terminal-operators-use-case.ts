import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';

import { ListTerminalOperatorsUseCase } from '../list-terminal-operators';

export function makeListTerminalOperatorsUseCase(): ListTerminalOperatorsUseCase {
  return new ListTerminalOperatorsUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosTerminalOperatorsRepository(),
    new PrismaEmployeesRepository(),
  );
}
