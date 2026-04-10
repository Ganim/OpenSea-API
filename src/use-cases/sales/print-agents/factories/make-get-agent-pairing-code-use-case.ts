import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { GetAgentPairingCodeUseCase } from '../get-agent-pairing-code.use-case';

export function makeGetAgentPairingCodeUseCase() {
  return new GetAgentPairingCodeUseCase(new PrismaPrintAgentsRepository());
}
