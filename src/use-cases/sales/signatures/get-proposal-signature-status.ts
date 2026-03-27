import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';
import type { GetEnvelopeByIdUseCase } from '@/use-cases/signature/envelopes/get-envelope-by-id';

interface GetProposalSignatureStatusUseCaseRequest {
  tenantId: string;
  proposalId: string;
}

interface GetProposalSignatureStatusUseCaseResponse {
  envelope: SignatureEnvelope;
}

export class GetProposalSignatureStatusUseCase {
  constructor(
    private proposalsRepository: ProposalsRepository,
    private getEnvelopeByIdUseCase: GetEnvelopeByIdUseCase,
  ) {}

  async execute(
    input: GetProposalSignatureStatusUseCaseRequest,
  ): Promise<GetProposalSignatureStatusUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.proposalId),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    if (!proposal.signatureEnvelopeId) {
      throw new BadRequestError(
        'This proposal does not have a signature envelope.',
      );
    }

    const { envelope } = await this.getEnvelopeByIdUseCase.execute({
      tenantId: input.tenantId,
      envelopeId: proposal.signatureEnvelopeId,
    });

    return { envelope };
  }
}
