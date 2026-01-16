import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { GetLabelTemplateByIdUseCase } from '../get-label-template-by-id';

export function makeGetLabelTemplateByIdUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new GetLabelTemplateByIdUseCase(labelTemplatesRepository);
}
