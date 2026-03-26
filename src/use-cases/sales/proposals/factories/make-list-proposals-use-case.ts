import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { ListProposalsUseCase } from '../list-proposals';

export function makeListProposalsUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const listProposalsUseCase = new ListProposalsUseCase(proposalsRepository);
  return listProposalsUseCase;
}
