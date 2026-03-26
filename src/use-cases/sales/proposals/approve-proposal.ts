import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface ApproveProposalUseCaseRequest {
  tenantId: string;
  id: string;
}

interface ApproveProposalUseCaseResponse {
  proposal: ProposalDTO;
}

export class ApproveProposalUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: ApproveProposalUseCaseRequest,
  ): Promise<ApproveProposalUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    if (proposal.status !== 'SENT' && proposal.status !== 'UNDER_REVIEW') {
      throw new BadRequestError(
        'Only proposals in SENT or UNDER_REVIEW status can be approved.',
      );
    }

    proposal.status = 'APPROVED';

    await this.proposalsRepository.save(proposal);

    return {
      proposal: proposalToDTO(proposal),
    };
  }
}
