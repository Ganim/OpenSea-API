import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { UpdateOrderItemQuantityUseCase } from '../update-order-item-quantity';

export function makeUpdateOrderItemQuantityUseCase() {
  return new UpdateOrderItemQuantityUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
  );
}
