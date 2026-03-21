import { PrismaDigitalCertificatesRepository } from '@/repositories/signature/prisma/prisma-digital-certificates-repository';
import { ListCertificatesUseCase } from '../list-certificates';

export function makeListCertificatesUseCase() {
  const repo = new PrismaDigitalCertificatesRepository();
  return new ListCertificatesUseCase(repo);
}
