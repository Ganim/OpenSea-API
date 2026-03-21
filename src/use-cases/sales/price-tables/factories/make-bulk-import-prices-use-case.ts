import { PrismaPriceTableItemsRepository } from '@/repositories/sales/prisma/prisma-price-table-items-repository';
import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { BulkImportPricesUseCase } from '@/use-cases/sales/price-tables/bulk-import-prices';

export function makeBulkImportPricesUseCase() {
  const priceTableItemsRepository = new PrismaPriceTableItemsRepository();
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new BulkImportPricesUseCase(priceTableItemsRepository, priceTablesRepository);
}
