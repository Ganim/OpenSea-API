import { PrismaGeneratedEmploymentContractsRepository } from '@/repositories/hr/prisma/prisma-generated-employment-contracts-repository';
import { makeGetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/factories/make-get-envelope-by-id-use-case';
import { GetContractSignatureStatusUseCase } from '../get-contract-signature-status';

export function makeGetContractSignatureStatusUseCase(): GetContractSignatureStatusUseCase {
  return new GetContractSignatureStatusUseCase(
    new PrismaGeneratedEmploymentContractsRepository(),
    makeGetEnvelopeByIdUseCase(),
  );
}
