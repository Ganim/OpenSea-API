import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { UnpairPrintAgentUseCase } from '../unpair-print-agent.use-case';

export function makeUnpairPrintAgentUseCase() {
  return new UnpairPrintAgentUseCase(
    new PrismaPrintAgentsRepository(),
    new PrismaPosPrintersRepository(),
  );
}
