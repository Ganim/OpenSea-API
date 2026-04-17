import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { generateOTP, hashOTP } from '@/lib/signature/otp';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureEmailService } from '@/services/signature/signature-email-service';

interface RequestSignerOTPUseCaseRequest {
  accessToken: string;
  ipAddress?: string;
  userAgent?: string;
}

interface RequestSignerOTPUseCaseResponse {
  otpExpiresAt: Date;
  emailDeliveryError?: string;
}

const OTP_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

export class RequestSignerOTPUseCase {
  constructor(
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
    private signatureEmailService: SignatureEmailService,
  ) {}

  async execute(
    request: RequestSignerOTPUseCaseRequest,
  ): Promise<RequestSignerOTPUseCaseResponse> {
    const signer = await this.signersRepository.findByAccessToken(
      request.accessToken,
    );

    if (!signer) {
      throw new ResourceNotFoundError('Invalid signing token');
    }

    if (['SIGNED', 'REJECTED', 'EXPIRED'].includes(signer.status)) {
      throw new BadRequestError(
        'Assinatura já finalizada. OTP não é mais necessário.',
      );
    }

    if (signer.signatureLevel === 'SIMPLE') {
      throw new BadRequestError('OTP não aplicável a este nível de assinatura');
    }

    if (!signer.externalEmail) {
      throw new BadRequestError(
        'Signatário não possui e-mail registrado para envio de OTP.',
      );
    }

    const now = new Date();
    const otpCode = generateOTP();
    const otpCodeHash = await hashOTP(otpCode);
    const otpExpiresAt = new Date(now.getTime() + OTP_EXPIRATION_MS);

    await this.signersRepository.update({
      id: signer.id.toString(),
      otpCodeHash,
      otpExpiresAt,
      otpAttempts: 0,
      otpSentAt: now,
      otpVerified: false,
    });

    let emailDeliveryError: string | undefined;

    try {
      const deliveryResult = await this.signatureEmailService.sendOTP({
        to: signer.externalEmail,
        signerName: signer.externalName ?? signer.externalEmail,
        otpCode,
        expiresAt: otpExpiresAt,
      });
      if (!deliveryResult.success) {
        emailDeliveryError =
          deliveryResult.message ?? 'Failed to deliver OTP email.';
      }
    } catch (error) {
      emailDeliveryError =
        error instanceof Error ? error.message : 'Failed to deliver OTP email.';
    }

    await this.auditEventsRepository.create({
      envelopeId: signer.envelopeId,
      tenantId: signer.tenantId.toString(),
      type: 'OTP_SENT',
      signerId: signer.id.toString(),
      description: 'OTP enviado ao signatário',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: emailDeliveryError
        ? { deliveryError: emailDeliveryError }
        : null,
    });

    return {
      otpExpiresAt,
      emailDeliveryError,
    };
  }
}
