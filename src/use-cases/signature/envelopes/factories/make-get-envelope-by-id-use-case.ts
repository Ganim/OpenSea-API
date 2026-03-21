import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { GetEnvelopeByIdUseCase } from '../get-envelope-by-id';

export function makeGetEnvelopeByIdUseCase() {
  return new GetEnvelopeByIdUseCase(new PrismaSignatureEnvelopesRepository());
}
