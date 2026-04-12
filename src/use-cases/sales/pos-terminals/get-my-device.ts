import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';
import type { PosSessionsRepository } from '@/repositories/sales/pos-sessions-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface GetMyDeviceUseCaseRequest {
  deviceTokenHash: string;
  tenantId?: string;
}

interface GetMyDeviceUseCaseResponse {
  terminal: PosTerminal;
  currentSession: PosSession | null;
}

export class GetMyDeviceUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private posDevicePairingsRepository: PosDevicePairingsRepository,
    private posSessionsRepository: PosSessionsRepository,
  ) {}

  async execute(
    request: GetMyDeviceUseCaseRequest,
  ): Promise<GetMyDeviceUseCaseResponse> {
    const pairing =
      await this.posDevicePairingsRepository.findByDeviceTokenHash(
        request.deviceTokenHash,
      );

    if (!pairing || !pairing.isActive) {
      throw new UnauthorizedError('Invalid or revoked device token');
    }

    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(pairing.terminalId.toString()),
      pairing.tenantId.toString(),
    );

    if (!terminal || !terminal.isActive || terminal.deletedAt) {
      throw new UnauthorizedError('Terminal is not active');
    }

    const currentSession =
      await this.posSessionsRepository.findActiveByTerminal(
        terminal.id.toString(),
        terminal.tenantId.toString(),
      );

    return { terminal, currentSession };
  }
}
