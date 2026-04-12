import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { GetPairingCodeUseCase } from '../get-pairing-code';

export function makeGetPairingCodeUseCase() {
  return new GetPairingCodeUseCase(new PrismaPosTerminalsRepository());
}
