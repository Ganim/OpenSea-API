import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { DuplicateProposalUseCase } from '../duplicate-proposal';

export function makeDuplicateProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const duplicateProposalUseCase = new DuplicateProposalUseCase(
    proposalsRepository,
  );
  return duplicateProposalUseCase;
}
