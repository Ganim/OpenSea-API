import { PrismaCashierSessionsRepository } from '@/repositories/sales/prisma/prisma-cashier-sessions-repository';
import { PrismaCashierTransactionsRepository } from '@/repositories/sales/prisma/prisma-cashier-transactions-repository';
import { GetCashierSessionByIdUseCase } from '../get-cashier-session-by-id';

export function makeGetCashierSessionByIdUseCase() {
  return new GetCashierSessionByIdUseCase(
    new PrismaCashierSessionsRepository(),
    new PrismaCashierTransactionsRepository(),
  );
}
