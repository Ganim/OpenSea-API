import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GetContractByIdUseCase } from '../get-contract-by-id';

export function makeGetContractByIdUseCase() {
  return new GetContractByIdUseCase(
    new PrismaContractsRepository(),
    new PrismaFinanceEntriesRepository(),
  );
}
