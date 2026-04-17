import { PrismaSignatureAuditEventsRepository } from '@/repositories/signature/prisma/prisma-signature-audit-events-repository';
import { PrismaSignatureEnvelopeSignersRepository } from '@/repositories/signature/prisma/prisma-signature-envelope-signers-repository';
import { SignatureEmailService } from '@/services/signature/signature-email-service';
import { RequestSignerOTPUseCase } from '../request-signer-otp';

export function makeRequestSignerOTPUseCase() {
  return new RequestSignerOTPUseCase(
    new PrismaSignatureEnvelopeSignersRepository(),
    new PrismaSignatureAuditEventsRepository(),
    new SignatureEmailService(),
  );
}
