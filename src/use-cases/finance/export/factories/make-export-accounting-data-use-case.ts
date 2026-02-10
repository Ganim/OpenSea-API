import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { ExportAccountingDataUseCase } from '../export-accounting-data';

export function makeExportAccountingDataUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();

  return new ExportAccountingDataUseCase(entriesRepository);
}
