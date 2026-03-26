import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { CreateMessageTemplateUseCase } from '../create-message-template';

export function makeCreateMessageTemplateUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new CreateMessageTemplateUseCase(messageTemplatesRepository);
}
