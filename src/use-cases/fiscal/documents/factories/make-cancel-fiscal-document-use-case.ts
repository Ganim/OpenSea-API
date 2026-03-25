import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { getFiscalProvider } from '@/services/fiscal/fiscal-provider-factory';
import { CancelFiscalDocumentUseCase } from '../cancel-fiscal-document';

/**
 * Factory for CancelFiscalDocumentUseCase.
 *
 * TODO: Replace in-memory repositories with Prisma implementations
 * once Prisma schema models for fiscal are created.
 */
export function makeCancelFiscalDocumentUseCase() {
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
  const fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
  const fiscalDocumentEventsRepository =
    new InMemoryFiscalDocumentEventsRepository();
  const fiscalProvider = getFiscalProvider('NUVEM_FISCAL');

  return new CancelFiscalDocumentUseCase(
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentEventsRepository,
    fiscalProvider,
  );
}
