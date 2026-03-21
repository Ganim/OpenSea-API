import { PrismaCampaignsRepository } from '@/repositories/sales/prisma/prisma-campaigns-repository';
import { PrismaCouponsRepository } from '@/repositories/sales/prisma/prisma-coupons-repository';
import { PrismaCustomerPricesRepository } from '@/repositories/sales/prisma/prisma-customer-prices-repository';
import { PrismaPriceTableItemsRepository } from '@/repositories/sales/prisma/prisma-price-table-items-repository';
import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { PriceResolver } from './price-resolver.service';

export function makePriceResolver(): PriceResolver {
  const customerPricesRepository = new PrismaCustomerPricesRepository();
  const campaignsRepository = new PrismaCampaignsRepository();
  const couponsRepository = new PrismaCouponsRepository();
  const priceTablesRepository = new PrismaPriceTablesRepository();
  const priceTableItemsRepository = new PrismaPriceTableItemsRepository();

  return new PriceResolver(
    customerPricesRepository,
    campaignsRepository,
    couponsRepository,
    priceTablesRepository,
    priceTableItemsRepository,
  );
}
