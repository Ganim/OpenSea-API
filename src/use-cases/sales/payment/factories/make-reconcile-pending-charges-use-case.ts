import { logger } from '@/lib/logger';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPaymentChargesRepository } from '@/repositories/sales/prisma/prisma-payment-charges-repository';
import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { PrismaPosTransactionPaymentsRepository } from '@/repositories/sales/prisma/prisma-pos-transaction-payments-repository';
import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { ChargeReconciliationService } from '@/services/payment/charge-reconciliation.service';
import { PaymentProviderFactory } from '@/services/payment/payment-provider.factory';
import { ReconcilePendingChargesUseCase } from '../reconcile-pending-charges.use-case';

export function makeReconcilePendingChargesUseCase() {
  const chargeRepository = new PrismaPaymentChargesRepository();
  const paymentConfigsRepository = new PrismaPaymentConfigsRepository();
  const orderRepository = new PrismaOrdersRepository();
  const posTransactionsRepository = new PrismaPosTransactionsRepository();
  const posTransactionPaymentsRepository =
    new PrismaPosTransactionPaymentsRepository();
  const paymentProviderFactory = new PaymentProviderFactory();

  const reconciliationService = new ChargeReconciliationService(
    chargeRepository,
    paymentConfigsRepository,
    paymentProviderFactory,
    orderRepository,
    logger,
    posTransactionsRepository,
    posTransactionPaymentsRepository,
  );

  return new ReconcilePendingChargesUseCase(reconciliationService);
}
