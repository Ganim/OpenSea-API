import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { UnpairPunchDeviceUseCase } from '../unpair-punch-device';

export function makeUnpairPunchDeviceUseCase() {
  return new UnpairPunchDeviceUseCase(new PrismaPunchDevicesRepository());
}
