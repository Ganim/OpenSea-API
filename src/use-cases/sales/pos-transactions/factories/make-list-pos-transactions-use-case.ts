import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { ListPosTransactionsUseCase } from '../list-pos-transactions';

export function makeListPosTransactionsUseCase() {
  return new ListPosTransactionsUseCase(new PrismaPosTransactionsRepository());
}
