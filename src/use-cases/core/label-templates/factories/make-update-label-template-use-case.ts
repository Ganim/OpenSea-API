import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { UpdateLabelTemplateUseCase } from '../update-label-template';

export function makeUpdateLabelTemplateUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new UpdateLabelTemplateUseCase(labelTemplatesRepository);
}
