import { PrismaPriceTablesRepository } from '@/repositories/sales/prisma/prisma-price-tables-repository';
import { DeletePriceTableUseCase } from '@/use-cases/sales/price-tables/delete-price-table';

export function makeDeletePriceTableUseCase() {
  const priceTablesRepository = new PrismaPriceTablesRepository();
  return new DeletePriceTableUseCase(priceTablesRepository);
}
