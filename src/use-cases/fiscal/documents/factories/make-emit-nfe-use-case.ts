import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { PrismaFiscalDocumentEventsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-events-repository';
import { PrismaFiscalDocumentItemsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-items-repository';
import { PrismaFiscalDocumentsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-documents-repository';
import { getFiscalProvider } from '@/services/fiscal/fiscal-provider-factory';
import { EmitNFeUseCase } from '../emit-nfe';

export function makeEmitNFeUseCase() {
  const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();
  const fiscalDocumentsRepository = new PrismaFiscalDocumentsRepository();
  const fiscalDocumentItemsRepository =
    new PrismaFiscalDocumentItemsRepository();
  const fiscalDocumentEventsRepository =
    new PrismaFiscalDocumentEventsRepository();
  const fiscalProvider = getFiscalProvider('NUVEM_FISCAL');

  return new EmitNFeUseCase(
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentItemsRepository,
    fiscalDocumentEventsRepository,
    fiscalProvider,
  );
}
