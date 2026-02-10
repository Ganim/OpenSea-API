import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { PrismaLoanInstallmentsRepository } from '@/repositories/finance/prisma/prisma-loan-installments-repository';
import { RegisterLoanPaymentUseCase } from '../register-loan-payment';

export function makeRegisterLoanPaymentUseCase() {
  const loansRepository = new PrismaLoansRepository();
  const installmentsRepository = new PrismaLoanInstallmentsRepository();
  return new RegisterLoanPaymentUseCase(
    loansRepository,
    installmentsRepository,
  );
}
