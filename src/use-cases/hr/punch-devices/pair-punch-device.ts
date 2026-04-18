import { createHash, randomBytes } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { isValidPairingCode } from '@/lib/pos-pairing-code';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';

export interface PairPunchDeviceRequest {
  tenantId: string;
  deviceId: string;
  pairingCode: string;
  hostname: string;
  pairedByUserId: string;
}

export interface PairPunchDeviceResponse {
  /**
   * Token opaco de 64 hex chars. Retornado UMA vez — no banco persistimos
   * apenas `SHA-256(deviceToken)`. O cliente (kiosk/PWA) deve guardar este
   * token para enviar no header `x-punch-device-token` em batidas futuras
   * (Plan 3 middleware).
   */
  deviceToken: string;
  deviceId: string;
  deviceName: string;
}

/**
 * Completa o pareamento de um PunchDevice.
 *
 * Fluxo (D-02):
 * 1. Admin passa JWT + deviceId + código TOTP de 6 chars (do display do kiosk)
 * 2. Validamos: device existe no tenant, não está pareado, código bate com
 *    `pairingSecret` (bucket atual ou anterior de 60s)
 * 3. Geramos `deviceToken = randomBytes(32).toString('hex')` (64 chars)
 * 4. Persistimos `SHA-256(deviceToken)` — nunca o plaintext
 * 5. Retornamos `deviceToken` plaintext UMA vez
 *
 * Diferença vs PrintAgent: aqui o admin já escolhe qual device está
 * pareando (via `deviceId`). Isso fecha T-04-02 (enumeração/replay entre
 * tenants) — a busca é restrita ao tenant + deviceId específico.
 */
export class PairPunchDeviceUseCase {
  constructor(private punchDevicesRepository: PunchDevicesRepository) {}

  async execute(
    input: PairPunchDeviceRequest,
  ): Promise<PairPunchDeviceResponse> {
    const device = await this.punchDevicesRepository.findById(
      new UniqueEntityID(input.deviceId),
      input.tenantId,
    );

    if (!device) {
      throw new ResourceNotFoundError('Dispositivo de ponto não encontrado');
    }

    if (device.isPaired) {
      throw new BadRequestError(
        'Dispositivo já está pareado. Revogue antes de reparear.',
      );
    }

    if (device.revokedAt) {
      throw new BadRequestError('Dispositivo foi revogado. Cadastre um novo.');
    }

    const normalizedCode = input.pairingCode.trim().toUpperCase();
    if (!isValidPairingCode(device.pairingSecret, normalizedCode)) {
      throw new BadRequestError('Código de pareamento inválido ou expirado');
    }

    const deviceToken = randomBytes(32).toString('hex');
    const deviceTokenHash = createHash('sha256')
      .update(deviceToken)
      .digest('hex');
    const deviceLabel = input.hostname.trim().slice(0, 128);

    device.pair(deviceTokenHash, deviceLabel, input.pairedByUserId);
    await this.punchDevicesRepository.save(device);

    return {
      deviceToken,
      deviceId: device.id.toString(),
      deviceName: device.name,
    };
  }
}
