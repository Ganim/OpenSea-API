import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PreviewReceiptUseCase } from '../preview-receipt.use-case';

export function makePreviewReceiptUseCase() {
  return new PreviewReceiptUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
  );
}
