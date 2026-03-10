import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { DeleteContractUseCase } from '../delete-contract';

export function makeDeleteContractUseCase() {
  return new DeleteContractUseCase(
    new PrismaContractsRepository(),
    new PrismaFinanceEntriesRepository(),
  );
}
