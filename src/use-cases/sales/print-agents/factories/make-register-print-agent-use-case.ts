import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { RegisterPrintAgentUseCase } from '../register-print-agent.use-case';

export function makeRegisterPrintAgentUseCase() {
  return new RegisterPrintAgentUseCase(new PrismaPrintAgentsRepository());
}
