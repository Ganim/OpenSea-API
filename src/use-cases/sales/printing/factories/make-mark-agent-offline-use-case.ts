import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { MarkAgentOfflineUseCase } from '../mark-agent-offline.use-case';

export function makeMarkAgentOfflineUseCase() {
  return new MarkAgentOfflineUseCase(
    new PrismaPrintAgentsRepository(),
    new PrismaPosPrintersRepository(),
  );
}
