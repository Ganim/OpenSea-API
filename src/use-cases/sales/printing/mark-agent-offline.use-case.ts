import type { PosPrintersRepository } from '@/repositories/sales/pos-printers-repository';
import type { PrintAgentsRepository } from '@/repositories/sales/print-agents-repository';

interface MarkAgentOfflineUseCaseRequest {
  thresholdDate: Date;
}

interface MarkAgentOfflineUseCaseResponse {
  markedOfflineCount: number;
}

export class MarkAgentOfflineUseCase {
  constructor(
    private printAgentsRepository: PrintAgentsRepository,
    private posPrintersRepository: PosPrintersRepository,
  ) {}

  async execute(
    input: MarkAgentOfflineUseCaseRequest,
  ): Promise<MarkAgentOfflineUseCaseResponse> {
    const staleAgents = await this.printAgentsRepository.findStaleAgents(
      input.thresholdDate,
    );

    let markedOfflineCount = 0;

    for (const agent of staleAgents) {
      agent.markOffline();
      await this.printAgentsRepository.save(agent);

      await this.posPrintersRepository.updateStatusByAgentId(
        agent.id.toString(),
        'OFFLINE',
      );

      markedOfflineCount++;
    }

    return { markedOfflineCount };
  }
}
