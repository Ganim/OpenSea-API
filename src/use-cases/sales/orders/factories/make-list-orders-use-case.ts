import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { ListOrdersUseCase } from '../list-orders';

export function makeListOrdersUseCase() {
  return new ListOrdersUseCase(new PrismaOrdersRepository());
}
