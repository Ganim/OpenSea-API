import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { PrismaLoanInstallmentsRepository } from '@/repositories/finance/prisma/prisma-loan-installments-repository';
import { GetLoanByIdUseCase } from '../get-loan-by-id';

export function makeGetLoanByIdUseCase() {
  const loansRepository = new PrismaLoansRepository();
  const installmentsRepository = new PrismaLoanInstallmentsRepository();
  return new GetLoanByIdUseCase(loansRepository, installmentsRepository);
}
