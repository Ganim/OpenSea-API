import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { ListPosTerminalsUseCase } from '../list-pos-terminals';

export function makeListPosTerminalsUseCase() {
  return new ListPosTerminalsUseCase(new PrismaPosTerminalsRepository());
}
