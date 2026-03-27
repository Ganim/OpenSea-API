import { PrismaCompaniesRepository } from '@/repositories/core/prisma/prisma-companies-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryRetentionsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-retentions-repository';
import { ExportSpedEfdUseCase } from '../export-sped-efd';

export function makeExportSpedEfdUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const retentionsRepository = new PrismaFinanceEntryRetentionsRepository();
  const companiesRepository = new PrismaCompaniesRepository();
  return new ExportSpedEfdUseCase(
    entriesRepository,
    retentionsRepository,
    companiesRepository,
  );
}
