import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaPaymentOrdersRepository } from '@/repositories/finance/prisma/prisma-payment-orders-repository';
import { CreatePaymentOrderUseCase } from '../create-payment-order';

export function makeCreatePaymentOrderUseCase() {
  const paymentOrdersRepository = new PrismaPaymentOrdersRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();

  return new CreatePaymentOrderUseCase(
    paymentOrdersRepository,
    financeEntriesRepository,
    bankAccountsRepository,
  );
}
