import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { CreatePdvOrderUseCase } from '../create-pdv-order';

export function makeCreatePdvOrderUseCase() {
  return new CreatePdvOrderUseCase(
    new PrismaOrdersRepository(),
    new PrismaPipelinesRepository(),
    new PrismaPipelineStagesRepository(),
    new PrismaCustomersRepository(),
  );
}
