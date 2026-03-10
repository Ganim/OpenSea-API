import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { UpdateContractUseCase } from '../update-contract';

export function makeUpdateContractUseCase() {
  return new UpdateContractUseCase(new PrismaContractsRepository());
}
