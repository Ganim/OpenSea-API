import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { ListPriceTablesUseCase } from '@/use-cases/sales/price-tables/list-price-tables';

export function makeListPriceTablesUseCase() {
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new ListPriceTablesUseCase(priceTablesRepository);
}
