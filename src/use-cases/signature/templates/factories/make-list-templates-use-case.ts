import { PrismaSignatureTemplatesRepository } from '@/repositories/signature/prisma/prisma-signature-templates-repository';
import { ListSignatureTemplatesUseCase } from '../list-templates';

export function makeListSignatureTemplatesUseCase() {
  return new ListSignatureTemplatesUseCase(
    new PrismaSignatureTemplatesRepository(),
  );
}
