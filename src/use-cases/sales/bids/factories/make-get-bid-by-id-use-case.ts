import { PrismaBidsRepository } from '@/repositories/sales/prisma/prisma-bids-repository';
import { GetBidByIdUseCase } from '@/use-cases/sales/bids/get-bid-by-id';

export function makeGetBidByIdUseCase() {
  return new GetBidByIdUseCase(new PrismaBidsRepository());
}
