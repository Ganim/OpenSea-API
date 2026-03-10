import { PrismaProductAttachmentsRepository } from '@/repositories/stock/prisma/prisma-product-attachments-repository';
import { ListProductAttachmentsUseCase } from '../list-product-attachments';

export function makeListProductAttachmentsUseCase() {
  const productAttachmentsRepository =
    new PrismaProductAttachmentsRepository();

  return new ListProductAttachmentsUseCase(
    productAttachmentsRepository,
  );
}
