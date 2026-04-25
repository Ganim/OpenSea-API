import { createHash, randomBytes } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PosDevicePairing } from '@/entities/sales/pos-device-pairing';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import { isValidPairingCode } from '@/lib/pos-pairing-code';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

interface PairDevicePublicUseCaseRequest {
  pairingCode: string;
  deviceLabel: string;
}

interface PairDevicePublicUseCaseResponse {
  deviceToken: string;
  terminal: PosTerminal;
}

/**
 * Public device pairing flow used by Emporion fresh installs that do not yet
 * carry a JWT. The 6-char rotating pairing code (printed in the RP web panel
 * by an authenticated admin) acts as the secret — anyone holding a valid code
 * can pair, but the controller is rate-limited (5/min/IP) and codes rotate
 * every minute.
 *
 * Cross-tenant scan: the use case calls
 * `findAllWithActivePairingSecret()` to locate the matching terminal across
 * tenants, since the caller has no tenant context. The pairing record itself
 * is created tenant-scoped to the matched terminal.
 *
 * Mirrors `PairDeviceUseCase` (JWT variant) for the success path so device
 * token generation, hashing and persistence stay identical.
 */
export class PairDevicePublicUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private posDevicePairingsRepository: PosDevicePairingsRepository,
  ) {}

  async execute(
    request: PairDevicePublicUseCaseRequest,
  ): Promise<PairDevicePublicUseCaseResponse> {
    const code = request.pairingCode.trim().toUpperCase();

    const terminals =
      await this.posTerminalsRepository.findAllWithActivePairingSecret();

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

    const pairingId = randomBytes(12).toString('hex');

    const pairing = PosDevicePairing.create({
      id: pairingId,
      tenantId: matched.tenantId,
      terminalId: matched.id,
      deviceLabel: request.deviceLabel,
      deviceTokenHash,
      // No authenticated user — store an empty string so the column
      // stays consistent with the JWT flow (the PosDevicePairing entity
      // accepts arbitrary user-id strings; the public flow uses
      // 'public' as a sentinel that the audit log can recognise).
      pairedByUserId: 'public',
    });

    await this.posDevicePairingsRepository.create(pairing);

    return { deviceToken, terminal: matched };
  }
}
