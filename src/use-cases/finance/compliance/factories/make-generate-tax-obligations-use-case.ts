import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceEntryRetentionsRepository } from '@/repositories/finance/prisma/prisma-finance-entry-retentions-repository';
import { PrismaTaxObligationsRepository } from '@/repositories/finance/prisma/prisma-tax-obligations-repository';
import { GenerateTaxObligationsUseCase } from '../generate-tax-obligations';

export function makeGenerateTaxObligationsUseCase() {
  const taxObligationsRepository = new PrismaTaxObligationsRepository();
  const retentionsRepository = new PrismaFinanceEntryRetentionsRepository();
  const entriesRepository = new PrismaFinanceEntriesRepository();
  return new GenerateTaxObligationsUseCase(
    taxObligationsRepository,
    retentionsRepository,
    entriesRepository,
  );
}
