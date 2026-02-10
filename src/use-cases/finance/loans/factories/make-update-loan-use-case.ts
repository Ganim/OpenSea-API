import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { UpdateLoanUseCase } from '../update-loan';

export function makeUpdateLoanUseCase() {
  const loansRepository = new PrismaLoansRepository();
  return new UpdateLoanUseCase(loansRepository);
}
