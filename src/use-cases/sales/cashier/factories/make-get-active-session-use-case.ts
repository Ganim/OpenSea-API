import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { GetActiveSessionUseCase } from '../get-active-session';

export function makeGetActiveSessionUseCase() {
  return new GetActiveSessionUseCase(new PrismaCashierSessionsRepository());
}
