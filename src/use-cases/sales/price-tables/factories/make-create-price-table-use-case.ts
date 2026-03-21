import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { CreatePriceTableUseCase } from '@/use-cases/sales/price-tables/create-price-table';

export function makeCreatePriceTableUseCase() {
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new CreatePriceTableUseCase(priceTablesRepository);
}
