import { PrismaPrintAgentsRepository } from '@/repositories/sales/prisma/prisma-print-agents-repository';
import { RegenerateAgentApiKeyUseCase } from '../regenerate-agent-api-key.use-case';

export function makeRegenerateAgentApiKeyUseCase() {
  return new RegenerateAgentApiKeyUseCase(new PrismaPrintAgentsRepository());
}
