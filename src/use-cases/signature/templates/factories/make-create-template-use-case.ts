import { PrismaSignatureTemplatesRepository } from '@/repositories/signature/prisma/prisma-signature-templates-repository';
import { CreateSignatureTemplateUseCase } from '../create-template';

export function makeCreateSignatureTemplateUseCase() {
  return new CreateSignatureTemplateUseCase(
    new PrismaSignatureTemplatesRepository(),
  );
}
