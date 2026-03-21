import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import { RejectDocumentUseCase } from '../reject-document';

export function makeRejectDocumentUseCase() {
  return new RejectDocumentUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
    new PrismaSignatureAuditEventsRepository(),
  );
}
