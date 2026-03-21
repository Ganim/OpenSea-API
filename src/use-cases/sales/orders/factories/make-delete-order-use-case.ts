import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { DeleteOrderUseCase } from '../delete-order';

export function makeDeleteOrderUseCase() {
  return new DeleteOrderUseCase(new PrismaOrdersRepository());
}
