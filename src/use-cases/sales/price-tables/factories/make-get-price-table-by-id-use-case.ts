import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { GetPriceTableByIdUseCase } from '@/use-cases/sales/price-tables/get-price-table-by-id';

export function makeGetPriceTableByIdUseCase() {
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new GetPriceTableByIdUseCase(priceTablesRepository);
}
