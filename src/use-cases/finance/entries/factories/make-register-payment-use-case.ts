import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryPaymentsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-payments-repository';
import { RegisterPaymentUseCase } from '../register-payment';

export function makeRegisterPaymentUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const paymentsRepository = new PrismaFinanceEntryPaymentsRepository();

  return new RegisterPaymentUseCase(entriesRepository, paymentsRepository);
}
