import { PrismaVariantAttachmentsRepository } from '@/repositories/stock/prisma/prisma-variant-attachments-repository';
import { DeleteVariantAttachmentUseCase } from '../delete-variant-attachment';

export function makeDeleteVariantAttachmentUseCase() {
  const variantAttachmentsRepository = new PrismaVariantAttachmentsRepository();

  return new DeleteVariantAttachmentUseCase(variantAttachmentsRepository);
}
