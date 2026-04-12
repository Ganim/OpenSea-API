import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { CloseOrphanSessionUseCase } from '../close-orphan-session';

export function makeCloseOrphanSessionUseCase() {
  return new CloseOrphanSessionUseCase(new PrismaPosSessionsRepository());
}
