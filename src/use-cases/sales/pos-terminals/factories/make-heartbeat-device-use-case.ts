import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { HeartbeatDeviceUseCase } from '../heartbeat-device';

export function makeHeartbeatDeviceUseCase() {
  return new HeartbeatDeviceUseCase(new PrismaPosDevicePairingsRepository());
}
