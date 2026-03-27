import { PrismaCustomersRepository } from '@/repositories/sales/prisma/prisma-customers-repository';
import { PrismaProposalsRepository } from '@/repositories/sales/prisma/prisma-proposals-repository';
import { makeCreateEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-create-envelope-use-case';
import { RequestProposalSignatureUseCase } from '../request-proposal-signature';

export function makeRequestProposalSignatureUseCase() {
  return new RequestProposalSignatureUseCase(
    new PrismaProposalsRepository(),
    new PrismaCustomersRepository(),
    makeCreateEnvelopeUseCase(),
  );
}
