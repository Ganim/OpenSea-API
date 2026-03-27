import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { makeGetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/factories/make-get-envelope-by-id-use-case';
import { GetProposalSignatureStatusUseCase } from '../get-proposal-signature-status';

export function makeGetProposalSignatureStatusUseCase() {
  return new GetProposalSignatureStatusUseCase(
    new PrismaProposalsRepository(),
    makeGetEnvelopeByIdUseCase(),
  );
}
