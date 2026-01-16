import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { DuplicateLabelTemplateUseCase } from '../duplicate-label-template';

export function makeDuplicateLabelTemplateUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new DuplicateLabelTemplateUseCase(labelTemplatesRepository);
}
