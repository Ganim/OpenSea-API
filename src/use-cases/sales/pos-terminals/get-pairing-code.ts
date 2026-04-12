import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface GetPairingCodeUseCaseRequest {
  tenantId: string;
  terminalId: string;
}

interface GetPairingCodeUseCaseResponse {
  code: string;
  expiresAt: Date;
}

export class GetPairingCodeUseCase {
  constructor(private posTerminalsRepository: PosTerminalsRepository) {}

  async execute(
    request: GetPairingCodeUseCaseRequest,
  ): Promise<GetPairingCodeUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    if (!terminal.pairingSecret) {
      throw new ResourceNotFoundError('Terminal has no pairing secret.');
    }

    return getCurrentPairingCode(terminal.pairingSecret);
  }
}
