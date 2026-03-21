import { PrismaOrderReturnsRepository } from '@/repositories/sales/prisma/prisma-order-returns-repository';
import { ListReturnsUseCase } from '../list-returns';

export function makeListReturnsUseCase() {
  return new ListReturnsUseCase(new PrismaOrderReturnsRepository());
}
