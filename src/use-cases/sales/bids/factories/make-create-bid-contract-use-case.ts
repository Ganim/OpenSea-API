import { PrismaBidsRepository } from '@/repositories/sales/prisma/prisma-bids-repository';
import { PrismaBidContractsRepository } from '@/repositories/sales/prisma/prisma-bid-contracts-repository';
import { PrismaBidHistoryRepository } from '@/repositories/sales/prisma/prisma-bid-history-repository';
import { CreateBidContractUseCase } from '@/use-cases/sales/bids/create-bid-contract';

export function makeCreateBidContractUseCase() {
  return new CreateBidContractUseCase(
    new PrismaBidsRepository(),
    new PrismaBidContractsRepository(),
    new PrismaBidHistoryRepository(),
  );
}
