import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { ListPrintAgentsUseCase } from '../list-print-agents.use-case';

export function makeListPrintAgentsUseCase() {
  return new ListPrintAgentsUseCase(
    new PrismaPrintAgentsRepository(),
    new PrismaPosPrintersRepository(),
  );
}
