import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface UnpairPrintAgentUseCaseRequest {
  tenantId: string;
  agentId: string;
}

export class UnpairPrintAgentUseCase {
  constructor(
    private printAgentsRepository: PrintAgentsRepository,
    private posPrintersRepository: PosPrintersRepository,
  ) {}

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

    // Clean up associated printers: mark OFFLINE and disassociate
    const agentPrinters = await this.posPrintersRepository.findByAgentId(
      input.agentId,
      input.tenantId,
    );

    for (const printer of agentPrinters) {
      printer.agentId = undefined;
      printer.status = 'OFFLINE';
      await this.posPrintersRepository.save(printer);
    }
  }
}
