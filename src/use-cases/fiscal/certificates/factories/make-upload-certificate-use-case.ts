import { InMemoryFiscalCertificatesRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-certificates-repository';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { UploadCertificateUseCase } from '../upload-certificate';

/**
 * Factory for UploadCertificateUseCase.
 *
 * TODO: Replace in-memory repositories with Prisma implementations
 * once Prisma schema models for fiscal are created.
 */
export function makeUploadCertificateUseCase() {
  const fiscalCertificatesRepository =
    new InMemoryFiscalCertificatesRepository();
  const fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();

  return new UploadCertificateUseCase(
    fiscalCertificatesRepository,
    fiscalConfigsRepository,
  );
}
