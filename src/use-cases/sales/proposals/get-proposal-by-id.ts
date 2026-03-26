import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface GetProposalByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetProposalByIdUseCaseResponse {
  proposal: ProposalDTO;
}

export class GetProposalByIdUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: GetProposalByIdUseCaseRequest,
  ): Promise<GetProposalByIdUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    return {
      proposal: proposalToDTO(proposal),
    };
  }
}
