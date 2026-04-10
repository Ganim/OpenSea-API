import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface RegenerateAgentApiKeyUseCaseRequest {
  tenantId: string;
  agentId: string;
}

interface RegenerateAgentApiKeyUseCaseResponse {
  apiKey: string;
}

export class RegenerateAgentApiKeyUseCase {
  constructor(private printAgentsRepository: PrintAgentsRepository) {}

  async execute(
    input: RegenerateAgentApiKeyUseCaseRequest,
  ): Promise<RegenerateAgentApiKeyUseCaseResponse> {
    const agent = await this.printAgentsRepository.findById(
      new UniqueEntityID(input.agentId),
      input.tenantId,
    );

    if (!agent) {
      throw new ResourceNotFoundError('Print agent not found.');
    }

    const plainKey = `osa_${randomBytes(24).toString('base64url')}`;
    const keyHash = await hash(plainKey, 10);
    const keyPrefix = plainKey.slice(0, 8);

    agent.apiKeyHash = keyHash;
    agent.apiKeyPrefix = keyPrefix;

    await this.printAgentsRepository.save(agent);

    return { apiKey: plainKey };
  }
}
