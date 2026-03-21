import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';

interface SignDocumentUseCaseRequest {
  accessToken: string;
  signatureData?: Record<string, unknown>;
  signatureImageFileId?: string;
  ipAddress?: string;
  userAgent?: string;
  geoLatitude?: number;
  geoLongitude?: number;
}

export class SignDocumentUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
  ) {}

  async execute(request: SignDocumentUseCaseRequest): Promise<void> {
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
      throw new BadRequestError('Signing was rejected');
    }

    if (signer.status === 'EXPIRED') {
      throw new BadRequestError('Signing link has expired');
    }

    if (
      signer.accessTokenExpiresAt &&
      signer.accessTokenExpiresAt < new Date()
    ) {
      throw new BadRequestError('Signing link has expired');
    }

    // Update signer
    await this.signersRepository.update({
      id: signer.id.toString(),
      status: 'SIGNED',
      signedAt: new Date(),
      signatureData: request.signatureData ?? null,
      signatureImageFileId: request.signatureImageFileId ?? null,
      ipAddress: request.ipAddress ?? null,
      userAgent: request.userAgent ?? null,
      geoLatitude: request.geoLatitude ?? null,
      geoLongitude: request.geoLongitude ?? null,
    });

    // Log audit event
    await this.auditEventsRepository.create({
      envelopeId: signer.envelopeId,
      tenantId: signer.tenantId.toString(),
      type: 'SIGNED',
      signerId: signer.id.toString(),
      description: `Signer signed the document`,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      geoLatitude: request.geoLatitude,
      geoLongitude: request.geoLongitude,
    });

    // Check if all signers in this group have signed
    const pendingInGroup =
      await this.signersRepository.findPendingByEnvelopeAndGroup(
        signer.envelopeId,
        signer.group,
      );

    if (pendingInGroup.length === 0) {
      // Check if all signers across all groups have signed
      const allSigners = await this.signersRepository.findByEnvelopeId(
        signer.envelopeId,
      );
      const allCompleted = allSigners.every(
        (s) => s.status === 'SIGNED' || s.status === 'REJECTED',
      );
      const allSigned = allSigners.every((s) => s.status === 'SIGNED');

      if (allSigned) {
        await this.envelopesRepository.update({
          id: signer.envelopeId,
          status: 'COMPLETED',
          completedAt: new Date(),
        });
      } else if (allCompleted) {
        // Some rejected
        await this.envelopesRepository.update({
          id: signer.envelopeId,
          status: 'REJECTED',
        });
      } else {
        // Move to next group — update envelope to IN_PROGRESS
        await this.envelopesRepository.update({
          id: signer.envelopeId,
          status: 'IN_PROGRESS',
        });
      }
    }
  }
}
