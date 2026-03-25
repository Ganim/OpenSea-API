import { PrismaFiscalDocumentsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-documents-repository';
import { ListFiscalDocumentsUseCase } from '../list-fiscal-documents';

export function makeListFiscalDocumentsUseCase() {
  const fiscalDocumentsRepository = new PrismaFiscalDocumentsRepository();

  return new ListFiscalDocumentsUseCase(fiscalDocumentsRepository);
}
