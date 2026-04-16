import { PrismaContractTemplatesRepository } from '@/repositories/hr/prisma/prisma-contract-templates-repository';
import { GetContractTemplateUseCase } from '../get-contract-template';

export function makeGetContractTemplateUseCase(): GetContractTemplateUseCase {
  const contractTemplatesRepository = new PrismaContractTemplatesRepository();
  return new GetContractTemplateUseCase(contractTemplatesRepository);
}
