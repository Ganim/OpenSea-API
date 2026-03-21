import { PrismaSignatureEnvelopesRepository } from '@/repositories/signature/prisma/prisma-signature-envelopes-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import { ResendNotificationsUseCase } from '../resend-notifications';

export function makeResendNotificationsUseCase() {
  return new ResendNotificationsUseCase(
    new PrismaSignatureEnvelopesRepository(),
    new PrismaSignatureEnvelopeSignersRepository(),
    new PrismaSignatureAuditEventsRepository(),
  );
}
