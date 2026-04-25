import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelinesRepository } from '@/repositories/sales/prisma/prisma-pipelines-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { PrismaPosOrderConflictsRepository } from '@/repositories/sales/prisma/prisma-pos-order-conflicts-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { makeCreateOrderUseCase } from '../../orders/factories/make-create-order-use-case';
import { CreateSaleFromTerminalUseCase } from '../create-sale-from-terminal';

export function makeCreateSaleFromTerminalUseCase(): CreateSaleFromTerminalUseCase {
  return new CreateSaleFromTerminalUseCase(
    new PrismaOrdersRepository(),
    new PrismaPosTerminalOperatorsRepository(),
    new PrismaPosOrderConflictsRepository(),
    new PrismaItemsRepository(),
    new PrismaVariantsRepository(),
    new PrismaBinsRepository(),
    new PrismaZonesRepository(),
    new PrismaCustomersRepository(),
    new PrismaPipelinesRepository(),
    new PrismaPipelineStagesRepository(),
    makeCreateOrderUseCase(),
    new PrismaTransactionManager(),
  );
}
