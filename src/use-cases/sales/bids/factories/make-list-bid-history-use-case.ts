import { PrismaBidHistoryRepository } from '@/repositories/sales/prisma/prisma-bid-history-repository';
import { ListBidHistoryUseCase } from '@/use-cases/sales/bids/list-bid-history';

export function makeListBidHistoryUseCase() {
  return new ListBidHistoryUseCase(new PrismaBidHistoryRepository());
}
