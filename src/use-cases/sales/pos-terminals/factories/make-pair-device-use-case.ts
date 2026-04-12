import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PairDeviceUseCase } from '../pair-device';

export function makePairDeviceUseCase() {
  return new PairDeviceUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosDevicePairingsRepository(),
  );
}
