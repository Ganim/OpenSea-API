import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { SendProposalUseCase } from '../send-proposal';

export function makeSendProposalUseCase() {
  const proposalsRepository = new PrismaProposalsRepository();
  const sendProposalUseCase = new SendProposalUseCase(proposalsRepository);
  return sendProposalUseCase;
}
