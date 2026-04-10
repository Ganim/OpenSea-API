import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface UnpairPrintAgentUseCaseRequest {
  tenantId: string;
  agentId: string;
}

export class UnpairPrintAgentUseCase {
  constructor(private printAgentsRepository: PrintAgentsRepository) {}

  async execute(input: UnpairPrintAgentUseCaseRequest): Promise<void> {
    const agent = await this.printAgentsRepository.findById(
      new UniqueEntityID(input.agentId),
      input.tenantId,
    );

    if (!agent) {
      throw new ResourceNotFoundError('Print agent not found.');
    }

    agent.unpair();
    await this.printAgentsRepository.save(agent);
  }
}
