import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { PrismaFinanceEntriesRepository } from '@/repositories/finance/prisma/prisma-finance-entries-repository';
import { CreateContractUseCase } from '../create-contract';

export function makeCreateContractUseCase() {
  const contractsRepository = new PrismaContractsRepository();
  const financeEntriesRepository = new PrismaFinanceEntriesRepository();

  return new CreateContractUseCase(contractsRepository, financeEntriesRepository);
}
