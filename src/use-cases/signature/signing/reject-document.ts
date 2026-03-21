import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';

interface RejectDocumentUseCaseRequest {
  accessToken: string;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

export class RejectDocumentUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
  ) {}

  async execute(request: RejectDocumentUseCaseRequest): Promise<void> {
    const signer = await this.signersRepository.findByAccessToken(
      request.accessToken,
    );

    if (!signer) {
      throw new ResourceNotFoundError('Invalid signing token');
    }

    if (signer.status === 'SIGNED') {
      throw new BadRequestError('Document already signed');
    }

    if (signer.status === 'REJECTED') {
      throw new BadRequestError('Already rejected');
    }

    await this.signersRepository.update({
      id: signer.id.toString(),
      status: 'REJECTED',
      rejectedAt: new Date(),
      rejectedReason: request.reason,
      ipAddress: request.ipAddress ?? null,
      userAgent: request.userAgent ?? null,
    });

    // Update envelope status to REJECTED
    await this.envelopesRepository.update({
      id: signer.envelopeId,
      status: 'REJECTED',
    });

    await this.auditEventsRepository.create({
      envelopeId: signer.envelopeId,
      tenantId: signer.tenantId.toString(),
      type: 'REJECTED',
      signerId: signer.id.toString(),
      description: `Signer rejected: ${request.reason}`,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
    });
  }
}
