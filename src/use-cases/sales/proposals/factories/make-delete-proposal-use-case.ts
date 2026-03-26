import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { DeleteProposalUseCase } from '../delete-proposal';

export function makeDeleteProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const deleteProposalUseCase = new DeleteProposalUseCase(proposalsRepository);
  return deleteProposalUseCase;
}
