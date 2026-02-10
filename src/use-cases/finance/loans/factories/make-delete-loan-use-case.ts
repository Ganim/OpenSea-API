import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { DeleteLoanUseCase } from '../delete-loan';

export function makeDeleteLoanUseCase() {
  const loansRepository = new PrismaLoansRepository();
  return new DeleteLoanUseCase(loansRepository);
}
