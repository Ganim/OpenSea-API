import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type {
  EnvelopeStatusValue,
  SignatureEnvelope,
} from '@/entities/signature/signature-envelope';
import type {
  SignerRoleValue,
  SignerStatusValue,
} from '@/entities/signature/signature-envelope-signer';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';

export interface VerifySignatureByCodeRequest {
  verificationCode: string;
}

export interface VerifySignatureByCodeSignerDTO {
  name: string | null;
  role: SignerRoleValue;
  status: SignerStatusValue;
  signedAt: Date | null;
}

export interface VerifySignatureByCodeResponse {
  status: EnvelopeStatusValue;
  envelopeTitle: string;
  verificationCode: string;
  documentHash: string;
  completedAt: Date | null;
  isValid: boolean;
  signers: VerifySignatureByCodeSignerDTO[];
}

export class VerifySignatureByCodeUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
  ) {}

  async execute(
    request: VerifySignatureByCodeRequest,
  ): Promise<VerifySignatureByCodeResponse> {
    const envelope = await this.envelopesRepository.findByVerificationCode(
      request.verificationCode,
    );

    if (!envelope) {
      throw new ResourceNotFoundError('Código de verificação inválido.');
    }

    const signers = await this.signersRepository.findByEnvelopeId(
      envelope.id.toString(),
    );

    return this.buildResponse(envelope, signers);
  }

  private buildResponse(
    envelope: SignatureEnvelope,
    signers: Awaited<
      ReturnType<SignatureEnvelopeSignersRepository['findByEnvelopeId']>
    >,
  ): VerifySignatureByCodeResponse {
    return {
      status: envelope.status,
      envelopeTitle: envelope.title,
      verificationCode: envelope.verificationCode ?? envelope.id.toString(),
      documentHash: envelope.documentHash,
      completedAt: envelope.completedAt,
      isValid: envelope.status === 'COMPLETED',
      signers: signers.map((signer) => ({
        name: signer.externalName,
        role: signer.role,
        status: signer.status,
        signedAt: signer.signedAt,
      })),
    };
  }
}
