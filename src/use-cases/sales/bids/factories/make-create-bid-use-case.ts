import { PrismaBidsRepository } from '@/repositories/sales/prisma/prisma-bids-repository';
import { PrismaBidHistoryRepository } from '@/repositories/sales/prisma/prisma-bid-history-repository';
import { CreateBidUseCase } from '@/use-cases/sales/bids/create-bid';

export function makeCreateBidUseCase() {
  const bidsRepository = new PrismaBidsRepository();
  const bidHistoryRepository = new PrismaBidHistoryRepository();
  return new CreateBidUseCase(bidsRepository, bidHistoryRepository);
}
