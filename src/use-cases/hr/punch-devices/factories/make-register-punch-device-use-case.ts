import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { RegisterPunchDeviceUseCase } from '../register-punch-device';

export function makeRegisterPunchDeviceUseCase() {
  return new RegisterPunchDeviceUseCase(new PrismaPunchDevicesRepository());
}
