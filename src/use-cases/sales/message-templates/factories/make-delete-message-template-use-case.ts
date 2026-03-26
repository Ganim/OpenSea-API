import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { DeleteMessageTemplateUseCase } from '../delete-message-template';

export function makeDeleteMessageTemplateUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new DeleteMessageTemplateUseCase(messageTemplatesRepository);
}
