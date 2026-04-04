import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { SendToCashierUseCase } from '../send-to-cashier';

export function makeSendToCashierUseCase() {
  return new SendToCashierUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
  );
}
