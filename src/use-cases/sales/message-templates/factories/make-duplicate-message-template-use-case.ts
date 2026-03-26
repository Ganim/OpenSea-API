import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { DuplicateMessageTemplateUseCase } from '../duplicate-message-template';

export function makeDuplicateMessageTemplateUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new DuplicateMessageTemplateUseCase(messageTemplatesRepository);
}
