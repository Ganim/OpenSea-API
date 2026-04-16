import { PrismaContractTemplatesRepository } from '@/repositories/hr/prisma/prisma-contract-templates-repository';
import { ListContractTemplatesUseCase } from '../list-contract-templates';

export function makeListContractTemplatesUseCase(): ListContractTemplatesUseCase {
  const contractTemplatesRepository = new PrismaContractTemplatesRepository();
  return new ListContractTemplatesUseCase(contractTemplatesRepository);
}
