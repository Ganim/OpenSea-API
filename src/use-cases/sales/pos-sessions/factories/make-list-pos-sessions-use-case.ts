import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { ListPosSessionsUseCase } from '../list-pos-sessions';

export function makeListPosSessionsUseCase() {
  return new ListPosSessionsUseCase(new PrismaPosSessionsRepository());
}
