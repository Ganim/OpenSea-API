import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { OpenCashierSessionUseCase } from '../open-cashier-session';

export function makeOpenCashierSessionUseCase() {
  return new OpenCashierSessionUseCase(new PrismaCashierSessionsRepository());
}
