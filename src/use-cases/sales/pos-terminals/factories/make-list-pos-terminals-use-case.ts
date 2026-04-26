import { PrismaPosDevicePairingsRepository } from '@/repositories/sales/prisma/prisma-pos-device-pairings-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { ListPosTerminalsUseCase } from '../list-pos-terminals';

export function makeListPosTerminalsUseCase() {
  return new ListPosTerminalsUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosDevicePairingsRepository(),
  );
}
