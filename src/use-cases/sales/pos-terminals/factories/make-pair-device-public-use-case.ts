import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PairDevicePublicUseCase } from '../pair-device-public';

export function makePairDevicePublicUseCase() {
  return new PairDevicePublicUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosDevicePairingsRepository(),
  );
}
