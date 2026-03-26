import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { RejectProposalUseCase } from '../reject-proposal';

export function makeRejectProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const rejectProposalUseCase = new RejectProposalUseCase(proposalsRepository);
  return rejectProposalUseCase;
}
