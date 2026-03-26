import { PrismaEsocialCertificatesRepository } from '@/repositories/esocial/prisma/prisma-esocial-certificates-repository';
import { UploadCertificateUseCase } from '../upload-certificate';

export function makeUploadCertificateUseCase(): UploadCertificateUseCase {
  const certificatesRepository = new PrismaEsocialCertificatesRepository();
  return new UploadCertificateUseCase(certificatesRepository);
}
