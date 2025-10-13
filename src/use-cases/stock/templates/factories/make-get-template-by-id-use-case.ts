import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { GetTemplateByIdUseCase } from '@/use-cases/stock/templates/get-template-by-id';

export function makeGetTemplateByIdUseCase() {
  const templatesRepository = new PrismaTemplatesRepository();
  return new GetTemplateByIdUseCase(templatesRepository);
}
