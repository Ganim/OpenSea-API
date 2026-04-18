import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { PairPunchDeviceUseCase } from '../pair-punch-device';

export function makePairPunchDeviceUseCase() {
  return new PairPunchDeviceUseCase(new PrismaPunchDevicesRepository());
}
