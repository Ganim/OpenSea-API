import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { ListTemplatesUseCase } from '@/use-cases/stock/templates/list-templates';

export function makeListTemplatesUseCase() {
  const templatesRepository = new PrismaTemplatesRepository();
  return new ListTemplatesUseCase(templatesRepository);
}
