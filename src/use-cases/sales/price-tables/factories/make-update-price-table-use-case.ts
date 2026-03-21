import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { UpdatePriceTableUseCase } from '@/use-cases/sales/price-tables/update-price-table';

export function makeUpdatePriceTableUseCase() {
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new UpdatePriceTableUseCase(priceTablesRepository);
}
