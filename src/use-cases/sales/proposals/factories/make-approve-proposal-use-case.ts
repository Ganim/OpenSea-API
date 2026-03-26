import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { ApproveProposalUseCase } from '../approve-proposal';

export function makeApproveProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const approveProposalUseCase = new ApproveProposalUseCase(
    proposalsRepository,
  );
  return approveProposalUseCase;
}
