import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { GetPosTerminalUseCase } from '../get-pos-terminal';

export function makeGetPosTerminalUseCase() {
  return new GetPosTerminalUseCase(new PrismaPosTerminalsRepository());
}
