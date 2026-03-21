import { PrismaDigitalCertificatesRepository } from '@/repositories/signature/prisma/prisma-digital-certificates-repository';
import { UploadCertificateUseCase } from '../upload-certificate';

export function makeUploadCertificateUseCase() {
  const repo = new PrismaDigitalCertificatesRepository();
  return new UploadCertificateUseCase(repo);
}
