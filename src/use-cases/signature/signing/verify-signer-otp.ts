import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { GoneError } from '@/@errors/use-cases/gone-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TooManyRequestsError } from '@/@errors/use-cases/too-many-requests-error';
import { verifyOTP } from '@/lib/signature/otp';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';

interface VerifySignerOTPUseCaseRequest {
  accessToken: string;
  otpCode: string;
  ipAddress?: string;
  userAgent?: string;
}

interface VerifySignerOTPUseCaseResponse {
  verified: boolean;
}

const MAX_OTP_ATTEMPTS = 3;

export class VerifySignerOTPUseCase {
  constructor(
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
  ) {}

  async execute(
    request: VerifySignerOTPUseCaseRequest,
  ): Promise<VerifySignerOTPUseCaseResponse> {
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

    if (!signer.otpCodeHash) {
      throw new BadRequestError('OTP não solicitado');
    }

    if (signer.otpExpiresAt && signer.otpExpiresAt < new Date()) {
      throw new GoneError('OTP expirado');
    }

    if (signer.otpAttempts >= MAX_OTP_ATTEMPTS) {
      throw new TooManyRequestsError('Limite de tentativas atingido');
    }

    const isMatch = await verifyOTP(request.otpCode, signer.otpCodeHash);

    if (!isMatch) {
      await this.signersRepository.update({
        id: signer.id.toString(),
        otpAttempts: signer.otpAttempts + 1,
      });

      await this.auditEventsRepository.create({
        envelopeId: signer.envelopeId,
        tenantId: signer.tenantId.toString(),
        type: 'OTP_VERIFIED',
        signerId: signer.id.toString(),
        description: 'Tentativa inválida de verificação de OTP',
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        metadata: { success: false, attempt: signer.otpAttempts + 1 },
      });

      return { verified: false };
    }

    await this.signersRepository.update({
      id: signer.id.toString(),
      otpVerified: true,
      otpCodeHash: null,
    });

    await this.auditEventsRepository.create({
      envelopeId: signer.envelopeId,
      tenantId: signer.tenantId.toString(),
      type: 'OTP_VERIFIED',
      signerId: signer.id.toString(),
      description: 'OTP verificado com sucesso',
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      metadata: { success: true },
    });

    return { verified: true };
  }
}
