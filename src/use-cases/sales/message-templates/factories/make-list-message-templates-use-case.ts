import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { ListMessageTemplatesUseCase } from '../list-message-templates';

export function makeListMessageTemplatesUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new ListMessageTemplatesUseCase(messageTemplatesRepository);
}
