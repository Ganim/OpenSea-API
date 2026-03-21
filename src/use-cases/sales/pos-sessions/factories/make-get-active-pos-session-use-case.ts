import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { GetActivePosSessionUseCase } from '../get-active-pos-session';

export function makeGetActivePosSessionUseCase() {
  return new GetActivePosSessionUseCase(new PrismaPosSessionsRepository());
}
