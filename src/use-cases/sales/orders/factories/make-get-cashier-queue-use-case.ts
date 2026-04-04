import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { GetCashierQueueUseCase } from '../get-cashier-queue';

export function makeGetCashierQueueUseCase() {
  return new GetCashierQueueUseCase(new PrismaOrdersRepository());
}
