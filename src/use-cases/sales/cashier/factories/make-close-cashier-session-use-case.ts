import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { PrismaCashierTransactionsRepository } from '@/repositories/sales/prisma/prisma-cashier-transactions-repository';
import { CloseCashierSessionUseCase } from '../close-cashier-session';

export function makeCloseCashierSessionUseCase() {
  return new CloseCashierSessionUseCase(
    new PrismaCashierSessionsRepository(),
    new PrismaCashierTransactionsRepository(),
  );
}
