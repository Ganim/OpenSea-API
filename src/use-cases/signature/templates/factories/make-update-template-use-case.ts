import { PrismaSignatureTemplatesRepository } from '@/repositories/signature/prisma/prisma-signature-templates-repository';
import { UpdateSignatureTemplateUseCase } from '../update-template';

export function makeUpdateSignatureTemplateUseCase() {
  return new UpdateSignatureTemplateUseCase(
    new PrismaSignatureTemplatesRepository(),
  );
}
