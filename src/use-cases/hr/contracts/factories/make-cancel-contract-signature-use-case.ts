import { PrismaGeneratedEmploymentContractsRepository } from '@/repositories/hr/prisma/prisma-generated-employment-contracts-repository';
import { makeCancelEnvelopeUseCase } from '@/use-cases/signature/envelopes/factories/make-cancel-envelope-use-case';
import { CancelContractSignatureUseCase } from '../cancel-contract-signature';

export function makeCancelContractSignatureUseCase(): CancelContractSignatureUseCase {
  return new CancelContractSignatureUseCase(
    new PrismaGeneratedEmploymentContractsRepository(),
    makeCancelEnvelopeUseCase(),
  );
}
