import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentItemsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-items-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { getFiscalProvider } from '@/services/fiscal/fiscal-provider-factory';
import { EmitNFCeUseCase } from '../emit-nfce';

/**
 * Factory for EmitNFCeUseCase.
 *
 * TODO: Replace in-memory repositories with Prisma implementations
 * once Prisma schema models for fiscal are created.
 */
export function makeEmitNFCeUseCase() {
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
  const fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
  const fiscalDocumentItemsRepository =
    new InMemoryFiscalDocumentItemsRepository();
  const fiscalDocumentEventsRepository =
    new InMemoryFiscalDocumentEventsRepository();
  const fiscalProvider = getFiscalProvider('NUVEM_FISCAL');

  return new EmitNFCeUseCase(
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentItemsRepository,
    fiscalDocumentEventsRepository,
    fiscalProvider,
  );
}
