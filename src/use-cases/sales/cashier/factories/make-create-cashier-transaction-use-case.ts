import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { PrismaCashierTransactionsRepository } from '@/repositories/sales/prisma/prisma-cashier-transactions-repository';
import { CreateCashierTransactionUseCase } from '../create-cashier-transaction';

export function makeCreateCashierTransactionUseCase() {
  return new CreateCashierTransactionUseCase(
    new PrismaCashierSessionsRepository(),
    new PrismaCashierTransactionsRepository(),
  );
}
