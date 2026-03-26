import { PrismaAccountantAccessesRepository } from '@/repositories/finance/prisma/prisma-accountant-accesses-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { GetAccountantDataUseCase } from '../get-accountant-data';

export function makeGetAccountantDataUseCase() {
  const accountantRepo = new PrismaAccountantAccessesRepository();
  const entriesRepo = new PrismaFinanceEntriesRepository();
  const categoriesRepo = new PrismaFinanceCategoriesRepository();
  return new GetAccountantDataUseCase(
    accountantRepo,
    entriesRepo,
    categoriesRepo,
  );
}
