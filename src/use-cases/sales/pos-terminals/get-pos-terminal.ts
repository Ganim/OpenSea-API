import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface GetPosTerminalUseCaseRequest {
  tenantId: string;
  terminalId: string;
}

interface GetPosTerminalUseCaseResponse {
  terminal: PosTerminal;
}

export class GetPosTerminalUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: GetPosTerminalUseCaseRequest,
  ): Promise<GetPosTerminalUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    return { terminal };
  }
}
