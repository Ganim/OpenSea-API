import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { DeletePunchDeviceUseCase } from '../delete-punch-device';

export function makeDeletePunchDeviceUseCase() {
  return new DeletePunchDeviceUseCase(new PrismaPunchDevicesRepository());
}
