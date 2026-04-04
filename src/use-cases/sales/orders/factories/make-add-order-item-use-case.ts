import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { AddOrderItemUseCase } from '../add-order-item';

export function makeAddOrderItemUseCase() {
  return new AddOrderItemUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
    new PrismaVariantsRepository(),
  );
}
