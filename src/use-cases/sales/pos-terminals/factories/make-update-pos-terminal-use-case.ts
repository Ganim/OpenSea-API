import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { UpdatePosTerminalUseCase } from '../update-pos-terminal';

export function makeUpdatePosTerminalUseCase() {
  return new UpdatePosTerminalUseCase(new PrismaPosTerminalsRepository());
}
