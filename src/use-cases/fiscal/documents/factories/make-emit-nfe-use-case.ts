import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentItemsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-items-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { getFiscalProvider } from '@/services/fiscal/fiscal-provider-factory';
import { EmitNFeUseCase } from '../emit-nfe';

/**
 * Factory for EmitNFeUseCase.
 *
 * TODO: Replace in-memory repositories with Prisma implementations
 * once Prisma schema models for fiscal are created.
 */
export function makeEmitNFeUseCase() {
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
  const fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
  const fiscalDocumentItemsRepository =
    new InMemoryFiscalDocumentItemsRepository();
  const fiscalDocumentEventsRepository =
    new InMemoryFiscalDocumentEventsRepository();
  const fiscalProvider = getFiscalProvider('NUVEM_FISCAL');

  return new EmitNFeUseCase(
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentItemsRepository,
    fiscalDocumentEventsRepository,
    fiscalProvider,
  );
}
