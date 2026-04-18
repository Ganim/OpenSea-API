import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { getCurrentPairingCode } from '@/lib/pos-pairing-code';
import type { PunchDevicesRepository } from '@/repositories/hr/punch-devices-repository';

export interface GetPunchDevicePairingCodeRequest {
  tenantId: string;
  deviceId: string;
}

export interface GetPunchDevicePairingCodeResponse {
  code: string;
  expiresAt: Date;
}

/**
 * Retorna o código TOTP atual (6 chars alfanuméricos, rotação de 60s) para
 * que o admin digite na tela de setup do dispositivo. Recusa se o device
 * já estiver pareado ou revogado.
 *
 * Algoritmo TOTP reutilizado de `@/lib/pos-pairing-code` (D-02).
 */
export class GetPunchDevicePairingCodeUseCase {
  constructor(private punchDevicesRepository: PunchDevicesRepository) {}

  async execute(
    input: GetPunchDevicePairingCodeRequest,
  ): Promise<GetPunchDevicePairingCodeResponse> {
    const device = await this.punchDevicesRepository.findById(
      new UniqueEntityID(input.deviceId),
      input.tenantId,
    );

    if (!device) {
      throw new ResourceNotFoundError('Dispositivo de ponto não encontrado');
    }

    if (device.isPaired) {
      throw new BadRequestError('Dispositivo já está pareado');
    }

    if (device.revokedAt) {
      throw new BadRequestError('Dispositivo foi revogado');
    }

    return getCurrentPairingCode(device.pairingSecret);
  }
}
