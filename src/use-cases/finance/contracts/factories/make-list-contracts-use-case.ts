import { PrismaContractsRepository } from '@/repositories/finance/prisma/prisma-contracts-repository';
import { ListContractsUseCase } from '../list-contracts';

export function makeListContractsUseCase() {
  return new ListContractsUseCase(new PrismaContractsRepository());
}
