import { PrismaFiscalCertificatesRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-certificates-repository';
import { PrismaFiscalConfigsRepository } from '@/repositories/fiscal/prisma/prisma-fiscal-configs-repository';
import { UploadCertificateUseCase } from '../upload-certificate';

export function makeUploadCertificateUseCase() {
  const fiscalCertificatesRepository = new PrismaFiscalCertificatesRepository();
  const fiscalConfigsRepository = new PrismaFiscalConfigsRepository();

  return new UploadCertificateUseCase(
    fiscalCertificatesRepository,
    fiscalConfigsRepository,
  );
}
