import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { CreateTemplateUseCase } from '@/use-cases/stock/templates/create-template';

export function makeCreateTemplateUseCase() {
  const templatesRepository = new PrismaTemplatesRepository();
  return new CreateTemplateUseCase(templatesRepository);
}
