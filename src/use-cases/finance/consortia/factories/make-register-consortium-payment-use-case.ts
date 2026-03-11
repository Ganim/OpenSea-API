import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaConsortiaRepository } from '@/repositories/finance/prisma/prisma-consortia-repository';
import { PrismaConsortiumPaymentsRepository } from '@/repositories/finance/prisma/prisma-consortium-payments-repository';
import { RegisterConsortiumPaymentUseCase } from '../register-consortium-payment';

export function makeRegisterConsortiumPaymentUseCase() {
  const consortiaRepository = new PrismaConsortiaRepository();
  const paymentsRepository = new PrismaConsortiumPaymentsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new RegisterConsortiumPaymentUseCase(
    consortiaRepository,
    paymentsRepository,
    transactionManager,
  );
}
