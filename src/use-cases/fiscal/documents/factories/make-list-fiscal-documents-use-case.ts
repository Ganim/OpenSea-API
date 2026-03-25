import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { ListFiscalDocumentsUseCase } from '../list-fiscal-documents';

/**
 * Factory for ListFiscalDocumentsUseCase.
 *
 * TODO: Replace in-memory repository with Prisma implementation
 * once Prisma schema models for fiscal are created.
 */
export function makeListFiscalDocumentsUseCase() {
  const fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
  return new ListFiscalDocumentsUseCase(fiscalDocumentsRepository);
}
