import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { PrismaPrintJobsRepository } from '@/repositories/sales/prisma/prisma-print-jobs-repository';
import { QueueReceiptUseCase } from '../queue-receipt.use-case';

export function makeQueueReceiptUseCase() {
  return new QueueReceiptUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
    new PrismaPosPrintersRepository(),
    new PrismaPrintJobsRepository(),
  );
}
