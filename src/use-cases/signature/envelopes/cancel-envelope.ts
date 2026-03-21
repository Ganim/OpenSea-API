import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';
import type { SignatureEnvelopeSignersRepository } from '@/repositories/signature/signature-envelope-signers-repository';
import type { SignatureAuditEventsRepository } from '@/repositories/signature/signature-audit-events-repository';

interface CancelEnvelopeUseCaseRequest {
  tenantId: string;
  envelopeId: string;
  reason?: string;
}

export class CancelEnvelopeUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
    private signersRepository: SignatureEnvelopeSignersRepository,
    private auditEventsRepository: SignatureAuditEventsRepository,
  ) {}

  async execute(request: CancelEnvelopeUseCaseRequest): Promise<void> {
    const envelope = await this.envelopesRepository.findById(
      new UniqueEntityID(request.envelopeId),
      request.tenantId,
    );

    if (!envelope) {
      throw new ResourceNotFoundError('Envelope not found');
    }

    if (envelope.status === 'COMPLETED') {
      throw new BadRequestError('Cannot cancel a completed envelope');
    }

    if (envelope.status === 'CANCELLED') {
      throw new BadRequestError('Envelope is already cancelled');
    }

    await this.envelopesRepository.update({
      id: request.envelopeId,
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: request.reason ?? null,
    });

    // Expire all pending signers
    await this.signersRepository.updateManyStatus(
      request.envelopeId,
      'EXPIRED',
    );

    await this.auditEventsRepository.create({
      envelopeId: request.envelopeId,
      tenantId: request.tenantId,
      type: 'CANCELLED',
      description: request.reason
        ? `Envelope cancelled: ${request.reason}`
        : 'Envelope cancelled',
    });
  }
}
