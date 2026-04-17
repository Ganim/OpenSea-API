import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { VerifySignatureByCodeUseCase } from '../verify-signature-by-code';

export function makeVerifySignatureByCodeUseCase() {
  return new VerifySignatureByCodeUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
  );
}
