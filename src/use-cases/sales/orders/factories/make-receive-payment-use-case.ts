import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPosTransactionPaymentsRepository } from '@/repositories/sales/prisma/prisma-pos-transaction-payments-repository';
import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { ReceivePaymentUseCase } from '../receive-payment';

export function makeReceivePaymentUseCase() {
  return new ReceivePaymentUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
    new PrismaVariantsRepository(),
    new PrismaPosTransactionsRepository(),
    new PrismaPosTransactionPaymentsRepository(),
    new PrismaTransactionManager(),
  );
}
