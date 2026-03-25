import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { getFiscalProvider } from '@/services/fiscal/fiscal-provider-factory';
import { CorrectionLetterUseCase } from '../correction-letter';

/**
 * Factory for CorrectionLetterUseCase.
 *
 * TODO: Replace in-memory repositories with Prisma implementations
 * once Prisma schema models for fiscal are created.
 */
export function makeCorrectionLetterUseCase() {
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
  const fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
  const fiscalDocumentEventsRepository =
    new InMemoryFiscalDocumentEventsRepository();
  const fiscalProvider = getFiscalProvider('NUVEM_FISCAL');

  return new CorrectionLetterUseCase(
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentEventsRepository,
    fiscalProvider,
  );
}
