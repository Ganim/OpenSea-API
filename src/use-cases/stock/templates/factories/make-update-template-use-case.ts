import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { UpdateTemplateUseCase } from '@/use-cases/stock/templates/update-template';

export function makeUpdateTemplateUseCase() {
  const templatesRepository = new PrismaTemplatesRepository();
  return new UpdateTemplateUseCase(templatesRepository);
}
