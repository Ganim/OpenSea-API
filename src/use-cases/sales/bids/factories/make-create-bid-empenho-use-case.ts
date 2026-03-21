import { PrismaBidContractsRepository } from '@/repositories/sales/prisma/prisma-bid-contracts-repository';
import { PrismaBidEmpenhosRepository } from '@/repositories/sales/prisma/prisma-bid-empenhos-repository';
import { CreateBidEmpenhoUseCase } from '@/use-cases/sales/bids/create-bid-empenho';

export function makeCreateBidEmpenhoUseCase() {
  return new CreateBidEmpenhoUseCase(
    new PrismaBidContractsRepository(),
    new PrismaBidEmpenhosRepository(),
  );
}
