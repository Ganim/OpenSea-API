import { PrismaBidsRepository } from '@/repositories/sales/prisma/prisma-bids-repository';
import { PrismaBidHistoryRepository } from '@/repositories/sales/prisma/prisma-bid-history-repository';
import { UpdateBidUseCase } from '@/use-cases/sales/bids/update-bid';

export function makeUpdateBidUseCase() {
  const bidsRepository = new PrismaBidsRepository();
  const bidHistoryRepository = new PrismaBidHistoryRepository();
  return new UpdateBidUseCase(bidsRepository, bidHistoryRepository);
}
