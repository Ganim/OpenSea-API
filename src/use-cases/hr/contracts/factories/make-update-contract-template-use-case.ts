import { PrismaContractTemplatesRepository } from '@/repositories/hr/prisma/prisma-contract-templates-repository';
import { UpdateContractTemplateUseCase } from '../update-contract-template';

export function makeUpdateContractTemplateUseCase(): UpdateContractTemplateUseCase {
  const contractTemplatesRepository = new PrismaContractTemplatesRepository();
  return new UpdateContractTemplateUseCase(contractTemplatesRepository);
}
