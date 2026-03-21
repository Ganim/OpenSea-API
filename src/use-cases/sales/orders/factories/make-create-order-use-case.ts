import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { PrismaOrderItemsRepository } from '@/repositories/sales/prisma/prisma-order-items-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { CreateOrderUseCase } from '../create-order';

export function makeCreateOrderUseCase() {
  return new CreateOrderUseCase(
    new PrismaOrdersRepository(),
    new PrismaOrderItemsRepository(),
    new PrismaCustomersRepository(),
    new PrismaPipelinesRepository(),
    new PrismaPipelineStagesRepository(),
  );
}
