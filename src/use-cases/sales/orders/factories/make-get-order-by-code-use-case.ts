import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { GetOrderByCodeUseCase } from '../get-order-by-code';

export function makeGetOrderByCodeUseCase() {
  return new GetOrderByCodeUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
  );
}
