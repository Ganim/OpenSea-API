import { PrismaAccountantAccessesRepository } from '@/repositories/finance/prisma/prisma-accountant-accesses-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFinanceCategoriesRepository } from '@/repositories/finance/prisma/prisma-finance-categories-repository';
import { SpedExportService } from '@/services/finance/sped-export.service';
import { ExportSpedUseCase } from '../export-sped';

export function makeExportSpedUseCase() {
  const accountantRepo = new PrismaAccountantAccessesRepository();
  const entriesRepo = new PrismaFinanceEntriesRepository();
  const categoriesRepo = new PrismaFinanceCategoriesRepository();
  const spedService = new SpedExportService(entriesRepo, categoriesRepo);
  return new ExportSpedUseCase(accountantRepo, spedService);
}
