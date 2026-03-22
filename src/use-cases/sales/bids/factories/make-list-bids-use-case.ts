import { PrismaBidsRepository } from '@/repositories/sales/prisma/prisma-bids-repository';
import { ListBidsUseCase } from '@/use-cases/sales/bids/list-bids';

export function makeListBidsUseCase() {
  return new ListBidsUseCase(new PrismaBidsRepository());
}
