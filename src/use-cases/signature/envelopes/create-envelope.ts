import { randomBytes } from 'node:crypto';
import { customAlphabet } from 'nanoid';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';
import type { SignatureEmailService } from '@/services/signature/signature-email-service';

// Human-legible alphabet: excludes I, O, 0, 1 to avoid confusion
const VERIFICATION_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const VERIFICATION_CODE_LENGTH = 10;
const generateVerificationCode = customAlphabet(
  VERIFICATION_CODE_ALPHABET,
  VERIFICATION_CODE_LENGTH,
);

interface SignerInput {
  userId?: string;
  contactId?: string;
  externalName?: string;
  externalEmail?: string;
  externalPhone?: string;
  externalDocument?: string;
  order: number;
  group: number;
  role: string;
  signatureLevel: string;
  certificateId?: string;
}

interface CreateEnvelopeUseCaseRequest {
  tenantId: string;
  title: string;
  description?: string;
  signatureLevel: string;
  minSignatureLevel?: string;
  documentFileId: string;
  documentHash: string;
  documentType?: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  routingType: string;
  expiresAt?: Date;
  reminderDays?: number;
  autoExpireDays?: number;
  createdByUserId: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  signers: SignerInput[];
}

interface CreateEnvelopeUseCaseResponse {
  envelope: SignatureEnvelope;
  emailDeliveryErrors: string[];
}

export class CreateEnvelopeUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
    private signatureEmailService?: SignatureEmailService,
  ) {}

  async execute(
    request: CreateEnvelopeUseCaseRequest,
  ): Promise<CreateEnvelopeUseCaseResponse> {
    const verificationCode = generateVerificationCode();

    const envelope = await this.envelopesRepository.create({
      tenantId: request.tenantId,
      title: request.title,
      description: request.description,
      signatureLevel: request.signatureLevel,
      minSignatureLevel: request.minSignatureLevel,
      verificationCode,
      documentFileId: request.documentFileId,
      documentHash: request.documentHash,
      documentType: request.documentType,
      sourceModule: request.sourceModule,
      sourceEntityType: request.sourceEntityType,
      sourceEntityId: request.sourceEntityId,
      routingType: request.routingType,
      expiresAt: request.expiresAt,
      reminderDays: request.reminderDays,
      autoExpireDays: request.autoExpireDays,
      createdByUserId: request.createdByUserId,
      tags: request.tags,
      metadata: request.metadata,
    });

    // Create signers with access tokens for external signers
    const signerData = request.signers.map((signer) => ({
      tenantId: request.tenantId,
      envelopeId: envelope.id.toString(),
      order: signer.order,
      group: signer.group,
      role: signer.role,
      userId: signer.userId ?? null,
      contactId: signer.contactId ?? null,
      externalName: signer.externalName ?? null,
      externalEmail: signer.externalEmail ?? null,
      externalPhone: signer.externalPhone ?? null,
      externalDocument: signer.externalDocument ?? null,
      signatureLevel: signer.signatureLevel,
      certificateId: signer.certificateId ?? null,
      accessToken: !signer.userId ? randomBytes(32).toString('hex') : null,
      accessTokenExpiresAt: !signer.userId
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null,
    }));

    const createdSigners = await this.signersRepository.createMany(signerData);

    // Create audit event
    await this.auditEventsRepository.create({
      envelopeId: envelope.id.toString(),
      tenantId: request.tenantId,
      type: 'CREATED',
      description: `Envelope "${request.title}" created with ${request.signers.length} signer(s)`,
    });

    // Send signature request emails to external signers (fail-soft)
    const emailDeliveryErrors: string[] = [];
    if (this.signatureEmailService) {
      const externalSigners = createdSigners.filter(
        (signer) =>
          signer.userId === null &&
          signer.externalEmail !== null &&
          signer.accessToken !== null,
      );

      for (const externalSigner of externalSigners) {
        try {
          const deliveryResult =
            await this.signatureEmailService.sendSignatureRequest({
              to: externalSigner.externalEmail as string,
              signerName: externalSigner.displayName,
              envelopeTitle: request.title,
              accessToken: externalSigner.accessToken as string,
              verificationCode,
              expiresAt: request.expiresAt ?? null,
            });

          if (deliveryResult.success) {
            await this.auditEventsRepository.create({
              envelopeId: envelope.id.toString(),
              tenantId: request.tenantId,
              type: 'SENT',
              signerId: externalSigner.signerId.toString(),
              description: `Signature request email sent to ${externalSigner.externalEmail}`,
            });
          } else {
            emailDeliveryErrors.push(
              `Failed to send email to ${externalSigner.externalEmail}: ${deliveryResult.message ?? 'unknown error'}`,
            );
          }
        } catch (error) {
          emailDeliveryErrors.push(
            `Email delivery error for ${externalSigner.externalEmail}: ${error instanceof Error ? error.message : 'unknown error'}`,
          );
        }
      }
    }

    return { envelope, emailDeliveryErrors };
  }
}
