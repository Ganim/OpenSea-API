import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface DeletePrintAgentUseCaseRequest {
  tenantId: string;
  agentId: string;
}

export class DeletePrintAgentUseCase {
  constructor(
    private printAgentsRepository: PrintAgentsRepository,
    private posPrintersRepository: PosPrintersRepository,
  ) {}

  async execute(input: DeletePrintAgentUseCaseRequest): Promise<void> {
    const agent = await this.printAgentsRepository.findById(
      new UniqueEntityID(input.agentId),
      input.tenantId,
    );

    if (!agent) {
      throw new ResourceNotFoundError('Print agent not found.');
    }

    agent.deletedAt = new Date();
    await this.printAgentsRepository.save(agent);

    // Soft-delete all printers associated with the deleted agent
    const agentPrinters = await this.posPrintersRepository.findByAgentId(
      input.agentId,
      input.tenantId,
    );

    for (const printer of agentPrinters) {
      printer.deletedAt = new Date();
      await this.posPrintersRepository.save(printer);
    }
  }
}
