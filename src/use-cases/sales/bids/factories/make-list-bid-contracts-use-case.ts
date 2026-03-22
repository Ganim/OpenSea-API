import { PrismaBidContractsRepository } from '@/repositories/sales/prisma/prisma-bid-contracts-repository';
import { ListBidContractsUseCase } from '@/use-cases/sales/bids/list-bid-contracts';

export function makeListBidContractsUseCase() {
  return new ListBidContractsUseCase(new PrismaBidContractsRepository());
}
