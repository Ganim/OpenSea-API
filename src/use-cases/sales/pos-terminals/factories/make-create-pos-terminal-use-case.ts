import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { CreatePosTerminalUseCase } from '../create-pos-terminal';

export function makeCreatePosTerminalUseCase() {
  return new CreatePosTerminalUseCase(new PrismaPosTerminalsRepository());
}
