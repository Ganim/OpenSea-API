import { PrismaEsocialCertificatesRepository } from '@/repositories/esocial/prisma/prisma-esocial-certificates-repository';
import { GetCertificateUseCase } from '../get-certificate';

export function makeGetCertificateUseCase(): GetCertificateUseCase {
  const certificatesRepository = new PrismaEsocialCertificatesRepository();
  return new GetCertificateUseCase(certificatesRepository);
}
