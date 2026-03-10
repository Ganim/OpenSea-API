import { PrismaProductAttachmentsRepository } from '@/repositories/stock/prisma/prisma-product-attachments-repository';
import { DeleteProductAttachmentUseCase } from '../delete-product-attachment';

export function makeDeleteProductAttachmentUseCase() {
  const productAttachmentsRepository =
    new PrismaProductAttachmentsRepository();

  return new DeleteProductAttachmentUseCase(
    productAttachmentsRepository,
  );
}
