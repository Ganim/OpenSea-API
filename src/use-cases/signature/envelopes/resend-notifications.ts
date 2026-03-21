import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';

interface ResendNotificationsUseCaseRequest {
  tenantId: string;
  envelopeId: string;
}

interface ResendNotificationsUseCaseResponse {
  notifiedCount: number;
}

export class ResendNotificationsUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
  ) {}

  async execute(
    request: ResendNotificationsUseCaseRequest,
  ): Promise<ResendNotificationsUseCaseResponse> {
    const envelope = await this.envelopesRepository.findById(
      new UniqueEntityID(request.envelopeId),
      request.tenantId,
    );

    if (!envelope) {
      throw new ResourceNotFoundError('Envelope not found');
    }

    const signers = await this.signersRepository.findByEnvelopeId(
      request.envelopeId,
    );

    const pendingSigners = signers.filter(
      (s) => !['SIGNED', 'REJECTED', 'EXPIRED'].includes(s.status),
    );

    for (const signer of pendingSigners) {
      await this.signersRepository.update({
        id: signer.id.toString(),
        lastNotifiedAt: new Date(),
        notificationCount: signer.notificationCount + 1,
      });
    }

    if (pendingSigners.length > 0) {
      await this.auditEventsRepository.create({
        envelopeId: request.envelopeId,
        tenantId: request.tenantId,
        type: 'REMINDED',
        description: `Reminder sent to ${pendingSigners.length} pending signer(s)`,
      });
    }

    return { notifiedCount: pendingSigners.length };
  }
}
