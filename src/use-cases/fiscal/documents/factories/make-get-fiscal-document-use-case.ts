import { PrismaFiscalDocumentEventsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-events-repository';
import { PrismaFiscalDocumentItemsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-items-repository';
import { PrismaFiscalDocumentsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-documents-repository';
import { GetFiscalDocumentUseCase } from '../get-fiscal-document';

export function makeGetFiscalDocumentUseCase() {
  const fiscalDocumentsRepository = new PrismaFiscalDocumentsRepository();
  const fiscalDocumentItemsRepository =
    new PrismaFiscalDocumentItemsRepository();
  const fiscalDocumentEventsRepository =
    new PrismaFiscalDocumentEventsRepository();

  return new GetFiscalDocumentUseCase(
    fiscalDocumentsRepository,
    fiscalDocumentItemsRepository,
    fiscalDocumentEventsRepository,
  );
}
