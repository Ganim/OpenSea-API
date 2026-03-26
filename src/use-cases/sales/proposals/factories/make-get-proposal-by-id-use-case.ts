import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { GetProposalByIdUseCase } from '../get-proposal-by-id';

export function makeGetProposalByIdUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const getProposalByIdUseCase = new GetProposalByIdUseCase(
    proposalsRepository,
  );
  return getProposalByIdUseCase;
}
