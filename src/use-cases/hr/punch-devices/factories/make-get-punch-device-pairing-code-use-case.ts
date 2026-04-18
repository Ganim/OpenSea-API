import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { GetPunchDevicePairingCodeUseCase } from '../get-punch-device-pairing-code';

export function makeGetPunchDevicePairingCodeUseCase() {
  return new GetPunchDevicePairingCodeUseCase(
    new PrismaPunchDevicesRepository(),
  );
}
