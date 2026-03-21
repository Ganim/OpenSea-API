import { PrismaPriceTableItemsRepository } from '@/repositories/sales/prisma/prisma-price-table-items-repository';
import { ListPriceTableItemsUseCase } from '@/use-cases/sales/price-tables/list-price-table-items';

export function makeListPriceTableItemsUseCase() {
  const priceTableItemsRepository = new PrismaPriceTableItemsRepository();
  return new ListPriceTableItemsUseCase(priceTableItemsRepository);
}
