import { PrismaBankAccountsRepository } from '@/repositories/finance/prisma/prisma-bank-accounts-repository';
import { PrismaCostCentersRepository } from '@/repositories/finance/prisma/prisma-cost-centers-repository';
import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { UpdateLoanUseCase } from '../update-loan';

export function makeUpdateLoanUseCase() {
  const loansRepository = new PrismaLoansRepository();
  const bankAccountsRepository = new PrismaBankAccountsRepository();
  const costCentersRepository = new PrismaCostCentersRepository();
  return new UpdateLoanUseCase(
    loansRepository,
    bankAccountsRepository,
    costCentersRepository,
  );
}
