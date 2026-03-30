import { PrismaCompaniesRepository } from '@/repositories/core/prisma/prisma-companies-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ExportSpedEcdUseCase } from '../export-sped-ecd';

export function makeExportSpedEcdUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const categoriesRepository = new PrismaFinanceCategoriesRepository();
  const companiesRepository = new PrismaCompaniesRepository();
  return new ExportSpedEcdUseCase(
    entriesRepository,
    categoriesRepository,
    companiesRepository,
  );
}
