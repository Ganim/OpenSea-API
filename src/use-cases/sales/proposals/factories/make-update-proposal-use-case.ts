import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { UpdateProposalUseCase } from '../update-proposal';

export function makeUpdateProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const updateProposalUseCase = new UpdateProposalUseCase(proposalsRepository);
  return updateProposalUseCase;
}
