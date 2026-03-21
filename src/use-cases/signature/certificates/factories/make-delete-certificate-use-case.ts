import { PrismaDigitalCertificatesRepository } from '@/repositories/signature/prisma/prisma-digital-certificates-repository';
import { DeleteCertificateUseCase } from '../delete-certificate';

export function makeDeleteCertificateUseCase() {
  const repo = new PrismaDigitalCertificatesRepository();
  return new DeleteCertificateUseCase(repo);
}
