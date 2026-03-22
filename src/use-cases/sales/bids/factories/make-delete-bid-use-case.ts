import { PrismaBidsRepository } from '@/repositories/sales/prisma/prisma-bids-repository';
import { DeleteBidUseCase } from '@/use-cases/sales/bids/delete-bid';

export function makeDeleteBidUseCase() {
  return new DeleteBidUseCase(new PrismaBidsRepository());
}
