import { PrismaLoansRepository } from '@/repositories/finance/prisma/prisma-loans-repository';
import { ListLoansUseCase } from '../list-loans';

export function makeListLoansUseCase() {
  const loansRepository = new PrismaLoansRepository();
  return new ListLoansUseCase(loansRepository);
}
