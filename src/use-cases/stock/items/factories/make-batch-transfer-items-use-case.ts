import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { BatchTransferItemsUseCase } from '../batch-transfer-items';

export function makeBatchTransferItemsUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const binsRepository = new PrismaBinsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();
  const transactionManager = new PrismaTransactionManager();

  return new BatchTransferItemsUseCase(
    itemsRepository,
    binsRepository,
    itemMovementsRepository,
    transactionManager,
  );
}
