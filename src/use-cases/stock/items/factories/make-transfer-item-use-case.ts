import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { TransferItemUseCase } from '../transfer-item';

export function makeTransferItemUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const binsRepository = new PrismaBinsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();
  const transactionManager = new PrismaTransactionManager();
  const zonesRepository = new PrismaZonesRepository();
  const variantsRepository = new PrismaVariantsRepository();

  return new TransferItemUseCase(
    itemsRepository,
    binsRepository,
    itemMovementsRepository,
    transactionManager,
    zonesRepository,
    variantsRepository,
  );
}
