import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface UnpairDeviceUseCaseRequest {
  tenantId: string;
  terminalId: string;
  revokedByUserId: string;
  reason?: string;
}

export class UnpairDeviceUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private posDevicePairingsRepository: PosDevicePairingsRepository,
  ) {}

  async execute(request: UnpairDeviceUseCaseRequest): Promise<void> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    const pairing = await this.posDevicePairingsRepository.findByTerminalId(
      request.terminalId,
    );

    if (!pairing || !pairing.isActive) {
      throw new ResourceNotFoundError('No active pairing for this terminal.');
    }

    pairing.revoke(request.revokedByUserId, request.reason);

    await this.posDevicePairingsRepository.save(pairing);
  }
}
