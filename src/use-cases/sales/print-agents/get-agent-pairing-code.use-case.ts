import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface GetAgentPairingCodeUseCaseRequest {
  tenantId: string;
  agentId: string;
}

interface GetAgentPairingCodeUseCaseResponse {
  code: string;
  expiresAt: Date;
}

export class GetAgentPairingCodeUseCase {
  constructor(private printAgentsRepository: PrintAgentsRepository) {}

  async execute(
    input: GetAgentPairingCodeUseCaseRequest,
  ): Promise<GetAgentPairingCodeUseCaseResponse> {
    const agent = await this.printAgentsRepository.findById(
      new UniqueEntityID(input.agentId),
      input.tenantId,
    );

    if (!agent) {
      throw new ResourceNotFoundError('Print agent not found.');
    }

    return getCurrentPairingCode(agent.pairingSecret);
  }
}
