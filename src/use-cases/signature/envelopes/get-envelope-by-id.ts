import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { SignatureEnvelopesRepository } from '@/repositories/signature/signature-envelopes-repository';

interface GetEnvelopeByIdUseCaseRequest {
  tenantId: string;
  envelopeId: string;
}

interface GetEnvelopeByIdUseCaseResponse {
  envelope: SignatureEnvelope;
}

export class GetEnvelopeByIdUseCase {
  constructor(
    private envelopesRepository: SignatureEnvelopesRepository,
  ) {}

  async execute(
    request: GetEnvelopeByIdUseCaseRequest,
  ): Promise<GetEnvelopeByIdUseCaseResponse> {
    const envelope = await this.envelopesRepository.findByIdWithRelations(
      new UniqueEntityID(request.envelopeId),
      request.tenantId,
    );

    if (!envelope) {
      throw new ResourceNotFoundError('Envelope not found');
    }

    return { envelope };
  }
}
