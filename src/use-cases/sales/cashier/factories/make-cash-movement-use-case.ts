import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { PrismaCashierTransactionsRepository } from '@/repositories/sales/prisma/prisma-cashier-transactions-repository';
import { CashMovementUseCase } from '../cash-movement';

export function makeCashMovementUseCase() {
  return new CashMovementUseCase(
    new PrismaCashierSessionsRepository(),
    new PrismaCashierTransactionsRepository(),
  );
}
