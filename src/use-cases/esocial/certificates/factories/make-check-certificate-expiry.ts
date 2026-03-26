import { PrismaEsocialCertificatesRepository } from '@/repositories/esocial/prisma/prisma-esocial-certificates-repository';
import { CheckCertificateExpiryUseCase } from '../check-certificate-expiry';

export function makeCheckCertificateExpiryUseCase(): CheckCertificateExpiryUseCase {
  const certificatesRepository = new PrismaEsocialCertificatesRepository();
  return new CheckCertificateExpiryUseCase(certificatesRepository);
}
