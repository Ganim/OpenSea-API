import { PrintAgent } from '@/entities/sales/print-agent';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface RegisterPrintAgentUseCaseRequest {
  tenantId: string;
  name: string;
}

interface RegisterPrintAgentUseCaseResponse {
  agentId: string;
}

export class RegisterPrintAgentUseCase {
  constructor(private printAgentsRepository: PrintAgentsRepository) {}

  async execute(
    input: RegisterPrintAgentUseCaseRequest,
  ): Promise<RegisterPrintAgentUseCaseResponse> {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(input.tenantId),
      name: input.name,
    });

    await this.printAgentsRepository.create(agent);

    return { agentId: agent.id.toString() };
  }
}
