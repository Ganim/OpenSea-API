import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTransactionPaymentsRepository } from '@/repositories/sales/prisma/prisma-pos-transaction-payments-repository';
import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { CreatePosTransactionUseCase } from '../create-pos-transaction';

export function makeCreatePosTransactionUseCase() {
  return new CreatePosTransactionUseCase(
    new PrismaPosTransactionsRepository(),
    new PrismaPosTransactionPaymentsRepository(),
    new PrismaPosSessionsRepository(),
  );
}
