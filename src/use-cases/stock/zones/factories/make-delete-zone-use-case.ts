import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { DeleteZoneUseCase } from '../delete-zone';

export function makeDeleteZoneUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const binsRepository = new PrismaBinsRepository();
  const itemsRepository = new PrismaItemsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();
  return new DeleteZoneUseCase(
    zonesRepository,
    binsRepository,
    itemsRepository,
    itemMovementsRepository,
  );
}
