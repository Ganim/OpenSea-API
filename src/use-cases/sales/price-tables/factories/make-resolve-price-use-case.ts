import { PrismaCustomerPricesRepository } from '@/repositories/sales/prisma/prisma-customer-prices-repository';
import { PrismaPriceTableItemsRepository } from '@/repositories/sales/prisma/prisma-price-table-items-repository';
import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { ResolvePriceUseCase } from '@/use-cases/sales/price-tables/resolve-price';

export function makeResolvePriceUseCase() {
  const priceTablesRepository = new PrismaPriceTablesRepository();
  const priceTableItemsRepository = new PrismaPriceTableItemsRepository();
  const customerPricesRepository = new PrismaCustomerPricesRepository();
  return new ResolvePriceUseCase(
    priceTablesRepository,
    priceTableItemsRepository,
    customerPricesRepository,
  );
}
