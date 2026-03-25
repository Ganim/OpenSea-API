import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentItemsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-items-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { GetFiscalDocumentUseCase } from '../get-fiscal-document';

/**
 * Factory for GetFiscalDocumentUseCase.
 *
 * TODO: Replace in-memory repositories with Prisma implementations
 * once Prisma schema models for fiscal are created.
 */
export function makeGetFiscalDocumentUseCase() {
  const fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
  const fiscalDocumentItemsRepository =
    new InMemoryFiscalDocumentItemsRepository();
  const fiscalDocumentEventsRepository =
    new InMemoryFiscalDocumentEventsRepository();

  return new GetFiscalDocumentUseCase(
    fiscalDocumentsRepository,
    fiscalDocumentItemsRepository,
    fiscalDocumentEventsRepository,
  );
}
