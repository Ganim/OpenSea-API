import { PrismaCompaniesRepository } from '@/repositories/core/prisma/prisma-companies-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetConsolidatedDREUseCase } from '../get-dre-consolidated';

export function makeGetConsolidatedDREUseCase() {
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const companiesRepository = new PrismaCompaniesRepository();
  return new GetConsolidatedDREUseCase(
    categoriesRepository,
    entriesRepository,
    companiesRepository,
  );
}
