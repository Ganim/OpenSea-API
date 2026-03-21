import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { DeletePosTerminalUseCase } from '../delete-pos-terminal';

export function makeDeletePosTerminalUseCase() {
  return new DeletePosTerminalUseCase(new PrismaPosTerminalsRepository());
}
