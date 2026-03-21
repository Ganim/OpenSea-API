import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import { CancelEnvelopeUseCase } from '../cancel-envelope';

export function makeCancelEnvelopeUseCase() {
  return new CancelEnvelopeUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
    new PrismaSignatureAuditEventsRepository(),
  );
}
