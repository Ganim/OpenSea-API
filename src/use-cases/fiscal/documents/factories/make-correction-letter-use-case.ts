import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { PrismaFiscalDocumentEventsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-document-events-repository';
import { PrismaFiscalDocumentsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-documents-repository';
import { getFiscalProvider } from '@/services/fiscal/fiscal-provider-factory';
import { CorrectionLetterUseCase } from '../correction-letter';

export function makeCorrectionLetterUseCase() {
  const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();
  const fiscalDocumentsRepository = new PrismaFiscalDocumentsRepository();
  const fiscalDocumentEventsRepository =
    new PrismaFiscalDocumentEventsRepository();
  const fiscalProvider = getFiscalProvider('NUVEM_FISCAL');

  return new CorrectionLetterUseCase(
    fiscalConfigsRepository,
    fiscalDocumentsRepository,
    fiscalDocumentEventsRepository,
    fiscalProvider,
  );
}
