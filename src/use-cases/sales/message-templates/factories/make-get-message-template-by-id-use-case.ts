import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { GetMessageTemplateByIdUseCase } from '../get-message-template-by-id';

export function makeGetMessageTemplateByIdUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new GetMessageTemplateByIdUseCase(messageTemplatesRepository);
}
