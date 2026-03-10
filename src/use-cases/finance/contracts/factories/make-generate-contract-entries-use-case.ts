import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { GenerateContractEntriesUseCase } from '../generate-contract-entries';

export function makeGenerateContractEntriesUseCase() {
  return new GenerateContractEntriesUseCase(
    new PrismaContractsRepository(),
    new PrismaFinanceEntriesRepository(),
  );
}
