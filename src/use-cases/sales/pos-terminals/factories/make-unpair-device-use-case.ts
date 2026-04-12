import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { UnpairDeviceUseCase } from '../unpair-device';

export function makeUnpairDeviceUseCase() {
  return new UnpairDeviceUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosDevicePairingsRepository(),
  );
}
