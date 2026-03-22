import { PrismaPriceTableItemsRepository } from '@/repositories/sales/prisma/prisma-price-table-items-repository';
import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { UpsertPriceTableItemUseCase } from '@/use-cases/sales/price-tables/upsert-price-table-item';

export function makeUpsertPriceTableItemUseCase() {
  const priceTableItemsRepository = new PrismaPriceTableItemsRepository();
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new UpsertPriceTableItemUseCase(
    priceTableItemsRepository,
    priceTablesRepository,
  );
}
