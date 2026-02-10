import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { PrismaLoanInstallmentsRepository } from '@/repositories/finance/prisma/prisma-loan-installments-repository';
import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { CreateLoanUseCase } from '../create-loan';

export function makeCreateLoanUseCase() {
  const loansRepository = new PrismaLoansRepository();
  const installmentsRepository = new PrismaLoanInstallmentsRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const costCentersRepository = new PrismaCostCentersRepository();

  return new CreateLoanUseCase(
    loansRepository,
    installmentsRepository,
    bankAccountsRepository,
    costCentersRepository,
  );
}
