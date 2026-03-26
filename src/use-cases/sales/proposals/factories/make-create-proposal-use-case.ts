import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { CreateProposalUseCase } from '../create-proposal';

export function makeCreateProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const createProposalUseCase = new CreateProposalUseCase(proposalsRepository);
  return createProposalUseCase;
}
