import { PrismaSignatureTemplatesRepository } from '@/repositories/signature/prisma/prisma-signature-templates-repository';
import { DeleteSignatureTemplateUseCase } from '../delete-template';

export function makeDeleteSignatureTemplateUseCase() {
  return new DeleteSignatureTemplateUseCase(
    new PrismaSignatureTemplatesRepository(),
  );
}
