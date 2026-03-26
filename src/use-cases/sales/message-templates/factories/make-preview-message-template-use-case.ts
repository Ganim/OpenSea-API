import { PrismaMessageTemplatesRepository } from '@/repositories/sales/prisma/prisma-message-templates-repository';
import { PreviewMessageTemplateUseCase } from '../preview-message-template';

export function makePreviewMessageTemplateUseCase() {
  const messageTemplatesRepository = new PrismaMessageTemplatesRepository();
  return new PreviewMessageTemplateUseCase(messageTemplatesRepository);
}
