import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { GetMyDeviceUseCase } from '../get-my-device';

export function makeGetMyDeviceUseCase() {
  return new GetMyDeviceUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosDevicePairingsRepository(),
    new PrismaPosSessionsRepository(),
  );
}
