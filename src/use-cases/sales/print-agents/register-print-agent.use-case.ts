import { randomBytes } from 'node:crypto';
import { hash } from 'bcryptjs';
import { PrintAgent } from '@/entities/sales/print-agent';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface RegisterPrintAgentUseCaseRequest {
  tenantId: string;
  name: string;
}

interface RegisterPrintAgentUseCaseResponse {
  agentId: string;
  apiKey: string;
}

export class RegisterPrintAgentUseCase {
  constructor(private printAgentsRepository: PrintAgentsRepository) {}

  async execute(
    input: RegisterPrintAgentUseCaseRequest,
  ): Promise<RegisterPrintAgentUseCaseResponse> {
    const plainKey = `osa_${randomBytes(24).toString('base64url')}`;
    const keyHash = await hash(plainKey, 10);
    const keyPrefix = plainKey.slice(0, 8);

    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(input.tenantId),
      name: input.name,
      apiKeyHash: keyHash,
      apiKeyPrefix: keyPrefix,
    });

    await this.printAgentsRepository.create(agent);

    return { agentId: agent.id.toString(), apiKey: plainKey };
  }
}
