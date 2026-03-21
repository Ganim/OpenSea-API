import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface DeletePosTerminalUseCaseRequest {
  tenantId: string;
  terminalId: string;
}

export class DeletePosTerminalUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(request: DeletePosTerminalUseCaseRequest): Promise<void> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    await this.posTerminalsRepository.delete(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );
  }
}
