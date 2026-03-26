import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { UpdateMessageTemplateUseCase } from '../update-message-template';

export function makeUpdateMessageTemplateUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new UpdateMessageTemplateUseCase(messageTemplatesRepository);
}
