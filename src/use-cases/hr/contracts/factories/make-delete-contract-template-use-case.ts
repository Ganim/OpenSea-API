import { PrismaContractTemplatesRepository } from '@/repositories/hr/prisma/prisma-contract-templates-repository';
import { DeleteContractTemplateUseCase } from '../delete-contract-template';

export function makeDeleteContractTemplateUseCase(): DeleteContractTemplateUseCase {
  const contractTemplatesRepository = new PrismaContractTemplatesRepository();
  return new DeleteContractTemplateUseCase(contractTemplatesRepository);
}
