import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PairThisDeviceUseCase } from '../pair-this-device';

export function makePairThisDeviceUseCase() {
  return new PairThisDeviceUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosDevicePairingsRepository(),
  );
}
