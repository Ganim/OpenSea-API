import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { PairPrintAgentUseCase } from '../pair-print-agent.use-case';

export function makePairPrintAgentUseCase() {
  return new PairPrintAgentUseCase(new PrismaPrintAgentsRepository());
}
