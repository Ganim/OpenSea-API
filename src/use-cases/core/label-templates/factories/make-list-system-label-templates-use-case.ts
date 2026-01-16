import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { ListSystemLabelTemplatesUseCase } from '../list-system-label-templates';

export function makeListSystemLabelTemplatesUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new ListSystemLabelTemplatesUseCase(labelTemplatesRepository);
}
