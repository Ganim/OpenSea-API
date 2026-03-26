import { PrismaEsocialCertificatesRepository } from '@/repositories/esocial/prisma/prisma-esocial-certificates-repository';
import { DeleteCertificateUseCase } from '../delete-certificate';

export function makeDeleteCertificateUseCase(): DeleteCertificateUseCase {
  const certificatesRepository = new PrismaEsocialCertificatesRepository();
  return new DeleteCertificateUseCase(certificatesRepository);
}
