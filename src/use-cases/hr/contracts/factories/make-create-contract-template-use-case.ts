import { PrismaContractTemplatesRepository } from '@/repositories/hr/prisma/prisma-contract-templates-repository';
import { CreateContractTemplateUseCase } from '../create-contract-template';

export function makeCreateContractTemplateUseCase(): CreateContractTemplateUseCase {
  const contractTemplatesRepository = new PrismaContractTemplatesRepository();
  return new CreateContractTemplateUseCase(contractTemplatesRepository);
}
