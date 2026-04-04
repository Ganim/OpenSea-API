import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { RemoveOrderItemUseCase } from '../remove-order-item';

export function makeRemoveOrderItemUseCase() {
  return new RemoveOrderItemUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
  );
}
