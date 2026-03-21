import { PrismaBidItemsRepository } from '@/repositories/sales/prisma/prisma-bid-items-repository';
import { ListBidItemsUseCase } from '@/use-cases/sales/bids/list-bid-items';

export function makeListBidItemsUseCase() {
  return new ListBidItemsUseCase(new PrismaBidItemsRepository());
}
