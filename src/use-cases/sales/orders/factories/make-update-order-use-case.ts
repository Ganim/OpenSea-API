import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { UpdateOrderUseCase } from '../update-order';

export function makeUpdateOrderUseCase() {
  return new UpdateOrderUseCase(new PrismaOrdersRepository());
}
