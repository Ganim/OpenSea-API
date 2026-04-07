import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { AddOrderItemUseCase } from '../add-order-item';
import { CreatePdvOrderUseCase } from '../create-pdv-order';
import { SendToCashierUseCase } from '../send-to-cashier';
import { SyncOfflineOrdersUseCase } from '../sync-offline-orders';

export function makeSyncOfflineOrdersUseCase() {
  const ordersRepository = new PrismaOrdersRepository();
  const orderItemsRepository = new PrismaOrderItemsRepository();

  return new SyncOfflineOrdersUseCase(
    new CreatePdvOrderUseCase(
      ordersRepository,
      new PrismaPipelinesRepository(),
      new PrismaPipelineStagesRepository(),
      new PrismaCustomersRepository(),
    ),
    new AddOrderItemUseCase(
      ordersRepository,
      orderItemsRepository,
      new PrismaVariantsRepository(),
    ),
    new SendToCashierUseCase(ordersRepository, orderItemsRepository),
    ordersRepository,
  );
}
