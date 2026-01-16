import { PrismaLabelTemplatesRepository } from '@/repositories/core/prisma/prisma-label-templates-repository';
import { ListLabelTemplatesUseCase } from '../list-label-templates';

export function makeListLabelTemplatesUseCase() {
  const labelTemplatesRepository = new PrismaLabelTemplatesRepository();
  return new ListLabelTemplatesUseCase(labelTemplatesRepository);
}
