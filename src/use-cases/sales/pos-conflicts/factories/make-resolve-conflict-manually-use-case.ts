import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { PrismaPosOrderConflictsRepository } from '@/repositories/sales/prisma/prisma-pos-order-conflicts-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';

import { makeCreateOrderUseCase } from '../../orders/factories/make-create-order-use-case';
import { ResolveConflictManuallyUseCase } from '../resolve-conflict-manually';

export function makeResolveConflictManuallyUseCase(): ResolveConflictManuallyUseCase {
  return new ResolveConflictManuallyUseCase(
    new PrismaPosOrderConflictsRepository(),
    new PrismaOrdersRepository(),
    new PrismaItemsRepository(),
    new PrismaItemMovementsRepository(),
    new PrismaCustomersRepository(),
    new PrismaPipelinesRepository(),
    new PrismaPipelineStagesRepository(),
    makeCreateOrderUseCase(),
  );
}
