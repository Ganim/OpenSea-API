import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface SendProposalUseCaseRequest {
  tenantId: string;
  id: string;
}

interface SendProposalUseCaseResponse {
  proposal: ProposalDTO;
}

export class SendProposalUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: SendProposalUseCaseRequest,
  ): Promise<SendProposalUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    if (proposal.status !== 'DRAFT') {
      throw new BadRequestError('Only proposals in DRAFT status can be sent.');
    }

    proposal.status = 'SENT';
    proposal.sentAt = new Date();

    await this.proposalsRepository.save(proposal);

    return {
      proposal: proposalToDTO(proposal),
    };
  }
}
