import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { DeletePrintAgentUseCase } from '../delete-print-agent.use-case';

export function makeDeletePrintAgentUseCase() {
  return new DeletePrintAgentUseCase(
    new PrismaPrintAgentsRepository(),
    new PrismaPosPrintersRepository(),
  );
}
