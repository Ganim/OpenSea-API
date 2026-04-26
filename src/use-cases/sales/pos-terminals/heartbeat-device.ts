import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { PosDevicePairingsRepository } from '@/repositories/sales/pos-device-pairings-repository';

interface HeartbeatDeviceUseCaseRequest {
  deviceId: string;
  appVersion?: string;
}

export class HeartbeatDeviceUseCase {
  constructor(private pairingsRepository: PosDevicePairingsRepository) {}

  async execute({
    deviceId,
    appVersion,
  }: HeartbeatDeviceUseCaseRequest): Promise<void> {
    const pairing = await this.pairingsRepository.findByTerminalId(deviceId);

    // verifyDeviceToken already validated the pairing exists for this token,
    // but the lookup here is by terminalId (since `device.deviceId` carries
    // pairingId, not terminalId, we resolve via terminalId from device ctx).
    if (!pairing || !pairing.isActive) {
      throw new ResourceNotFoundError('Pairing not found or revoked.');
    }

    pairing.lastSeenAt = new Date();
    if (appVersion) {
      pairing.appVersion = appVersion;
    }

    await this.pairingsRepository.save(pairing);
  }
}
