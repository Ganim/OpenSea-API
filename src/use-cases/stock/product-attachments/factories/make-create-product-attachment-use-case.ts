import { PrismaProductAttachmentsRepository } from '@/repositories/stock/prisma/prisma-product-attachments-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { CreateProductAttachmentUseCase } from '../create-product-attachment';

export function makeCreateProductAttachmentUseCase() {
  const productAttachmentsRepository =
    new PrismaProductAttachmentsRepository();
  const productsRepository = new PrismaProductsRepository();

  return new CreateProductAttachmentUseCase(
    productAttachmentsRepository,
    productsRepository,
  );
}
