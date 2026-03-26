import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { PrismaFiscalDocumentItemsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-items-repository';
import { PrismaFiscalDocumentsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-documents-repository';
import { NuvemFiscalProvider } from '@/services/fiscal/nuvem-fiscal.provider';
import { EmitNfeFromEntryUseCase } from '../emit-nfe-from-entry';

export function makeEmitNfeFromEntryUseCase() {
  const entriesRepository = new PrismaFinanceEntriesRepository();
  const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();
  const fiscalDocumentsRepository = new PrismaFiscalDocumentsRepository();
  const fiscalDocumentItemsRepository =
    new PrismaFiscalDocumentItemsRepository();
  const fiscalProvider = new NuvemFiscalProvider();

  return new EmitNfeFromEntryUseCase(
    entriesRepository,
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentItemsRepository,
    fiscalProvider,
  );
}
