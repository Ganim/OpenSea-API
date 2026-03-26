import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface DeleteProposalUseCaseRequest {
  tenantId: string;
  id: string;
}

interface DeleteProposalUseCaseResponse {
  message: string;
}

export class DeleteProposalUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: DeleteProposalUseCaseRequest,
  ): Promise<DeleteProposalUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    if (proposal.status !== 'DRAFT' && proposal.status !== 'REJECTED') {
      throw new BadRequestError(
        'Only proposals in DRAFT or REJECTED status can be deleted.',
      );
    }

    proposal.delete();
    await this.proposalsRepository.save(proposal);

    return {
      message: 'Proposal deleted successfully.',
    };
  }
}
