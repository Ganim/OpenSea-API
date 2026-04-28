import { createHash, randomBytes } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import { isValidPairingCode } from '@/lib/pos-pairing-code';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface PairDeviceUseCaseRequest {
  tenantId: string;
  pairingCode: string;
  deviceLabel: string;
  pairedByUserId: string;
}

interface PairDeviceUseCaseResponse {
  deviceToken: string;
  terminal: PosTerminal;
}

export class PairDeviceUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private posDevicePairingsRepository: PosDevicePairingsRepository,
  ) {}

  async execute(
    request: PairDeviceUseCaseRequest,
  ): Promise<PairDeviceUseCaseResponse> {
    const { data: terminals } =
      await this.posTerminalsRepository.findManyPaginated({
        tenantId: request.tenantId,
        page: 1,
        limit: 1000,
        isActive: true,
      });

    const code = request.pairingCode.trim().toUpperCase();
    const matched = terminals.find(
      (t) => t.pairingSecret && isValidPairingCode(t.pairingSecret, code),
    );

    if (!matched) {
      throw new BadRequestError('Invalid or expired pairing code.');
    }

    if (matched.deletedAt) {
      throw new BadRequestError('Terminal is not active.');
    }

    const existing = await this.posDevicePairingsRepository.findByTerminalId(
      matched.id.toString(),
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
        tenantId: matched.tenantId,
        terminalId: matched.id,
        deviceLabel: request.deviceLabel,
        deviceTokenHash,
        pairedByUserId: request.pairedByUserId,
      });
      await this.posDevicePairingsRepository.create(pairing);
    }

    return { deviceToken, terminal: matched };
  }
}
