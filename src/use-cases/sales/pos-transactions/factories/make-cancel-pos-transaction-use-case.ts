import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { CancelPosTransactionUseCase } from '../cancel-pos-transaction';

export function makeCancelPosTransactionUseCase() {
  return new CancelPosTransactionUseCase(new PrismaPosTransactionsRepository());
}
