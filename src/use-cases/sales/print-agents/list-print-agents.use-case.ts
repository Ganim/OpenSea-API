import type { PrintAgent } from '@/entities/sales/print-agent';
import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface ListPrintAgentsUseCaseRequest {
  tenantId: string;
}

export interface PrintAgentWithPrinterCount {
  agent: PrintAgent;
  printerCount: number;
}

interface ListPrintAgentsUseCaseResponse {
  agents: PrintAgentWithPrinterCount[];
}

export class ListPrintAgentsUseCase {
  constructor(
    private printAgentsRepository: PrintAgentsRepository,
    private posPrintersRepository: PosPrintersRepository,
  ) {}

  async execute(
    input: ListPrintAgentsUseCaseRequest,
  ): Promise<ListPrintAgentsUseCaseResponse> {
    const agents = await this.printAgentsRepository.findManyByTenant(
      input.tenantId,
    );

    const agentsWithPrinterCount: PrintAgentWithPrinterCount[] =
      await Promise.all(
        agents.map(async (agent) => {
          const printers = await this.posPrintersRepository.findByAgentId(
            agent.id.toString(),
            input.tenantId,
          );

          return { agent, printerCount: printers.length };
        }),
      );

    return { agents: agentsWithPrinterCount };
  }
}
