import { PrismaTemplatesRepository } from '@/repositories/stock/prisma/prisma-templates-repository';
import { DeleteTemplateUseCase } from '@/use-cases/stock/templates/delete-template';

export function makeDeleteTemplateUseCase() {
  const templatesRepository = new PrismaTemplatesRepository();
  return new DeleteTemplateUseCase(templatesRepository);
}
