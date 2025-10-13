import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaLocationsRepository } from '@/repositories/stock/prisma/prisma-locations-repository';
import { TransferItemUseCase } from '../transfer-item';

export function makeTransferItemUseCase() {
  const itemsRepository = new PrismaItemsRepository();
  const locationsRepository = new PrismaLocationsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();

  return new TransferItemUseCase(
    itemsRepository,
    locationsRepository,
    itemMovementsRepository,
  );
}
