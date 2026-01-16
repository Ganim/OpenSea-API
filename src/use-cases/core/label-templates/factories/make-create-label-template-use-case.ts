import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { CreateLabelTemplateUseCase } from '../create-label-template';

export function makeCreateLabelTemplateUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new CreateLabelTemplateUseCase(labelTemplatesRepository);
}
