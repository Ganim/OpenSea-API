import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { PrismaCashierTransactionsRepository } from '@/repositories/sales/prisma/prisma-cashier-transactions-repository';
import { ListCashierTransactionsUseCase } from '../list-cashier-transactions';

export function makeListCashierTransactionsUseCase() {
  return new ListCashierTransactionsUseCase(
    new PrismaCashierSessionsRepository(),
    new PrismaCashierTransactionsRepository(),
  );
}
