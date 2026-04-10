import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { UnpairPrintAgentUseCase } from '../unpair-print-agent.use-case';

export function makeUnpairPrintAgentUseCase() {
  return new UnpairPrintAgentUseCase(new PrismaPrintAgentsRepository());
}
