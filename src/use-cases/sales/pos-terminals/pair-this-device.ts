import { createHash, randomBytes } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface PairThisDeviceUseCaseRequest {
  tenantId: string;
  terminalId: string;
  deviceLabel: string;
  pairedByUserId: string;
}

interface PairThisDeviceUseCaseResponse {
  deviceToken: string;
  terminal: PosTerminal;
}

export class PairThisDeviceUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private posDevicePairingsRepository: PosDevicePairingsRepository,
  ) {}

  async execute(
    request: PairThisDeviceUseCaseRequest,
  ): Promise<PairThisDeviceUseCaseResponse> {
    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(request.terminalId),
      request.tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('Terminal not found.');
    }

    if (!terminal.isActive || terminal.deletedAt) {
      throw new BadRequestError('Terminal is not active.');
    }

    const existing = await this.posDevicePairingsRepository.findByTerminalId(
      terminal.id.toString(),
    );

    if (existing && existing.isActive) {
      throw new BadRequestError(
        'Terminal already has an active device pairing. Unpair it first.',
      );
    }

    const deviceToken = randomBytes(32).toString('hex');
    const deviceTokenHash = createHash('sha256')
      .update(deviceToken)
      .digest('hex');

    if (existing) {
      // Reaproveita o registro revogado — `terminalId @unique` no schema
      // impede criar novo. Limpa marcadores de revoga e regenera token.
      existing.reactivate({
        deviceTokenHash,
        deviceLabel: request.deviceLabel,
        pairedByUserId: request.pairedByUserId,
        pairingSource: 'JWT',
      });
      await this.posDevicePairingsRepository.save(existing);
    } else {
      const pairingId = randomBytes(12).toString('hex');
      const pairing = PosDevicePairing.create({
        id: pairingId,
        tenantId: terminal.tenantId,
        terminalId: terminal.id,
        deviceLabel: request.deviceLabel,
        deviceTokenHash,
        pairedByUserId: request.pairedByUserId,
      });
      await this.posDevicePairingsRepository.create(pairing);
    }

    return { deviceToken, terminal };
  }
}
