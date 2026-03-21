import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import { CreateEnvelopeUseCase } from '../create-envelope';

export function makeCreateEnvelopeUseCase() {
  return new CreateEnvelopeUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
    new PrismaSignatureAuditEventsRepository(),
  );
}
