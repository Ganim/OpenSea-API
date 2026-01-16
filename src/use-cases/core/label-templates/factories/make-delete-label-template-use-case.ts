import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { DeleteLabelTemplateUseCase } from '../delete-label-template';

export function makeDeleteLabelTemplateUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new DeleteLabelTemplateUseCase(labelTemplatesRepository);
}
