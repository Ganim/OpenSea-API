import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import { SignDocumentUseCase } from '../sign-document';

export function makeSignDocumentUseCase() {
  return new SignDocumentUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
    new PrismaSignatureAuditEventsRepository(),
  );
}
