import { randomBytes } from 'node:crypto';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';

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
}

export class CreateEnvelopeUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
  ) {}

  async execute(
    request: CreateEnvelopeUseCaseRequest,
  ): Promise<CreateEnvelopeUseCaseResponse> {
    const envelope = await this.envelopesRepository.create({
      tenantId: request.tenantId,
      title: request.title,
      description: request.description,
      signatureLevel: request.signatureLevel,
      minSignatureLevel: request.minSignatureLevel,
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

    await this.signersRepository.createMany(signerData);

    // Create audit event
    await this.auditEventsRepository.create({
      envelopeId: envelope.id.toString(),
      tenantId: request.tenantId,
      type: 'CREATED',
      description: `Envelope "${request.title}" created with ${request.signers.length} signer(s)`,
    });

    return { envelope };
  }
}
