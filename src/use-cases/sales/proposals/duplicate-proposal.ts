import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface DuplicateProposalUseCaseRequest {
  tenantId: string;
  id: string;
  createdBy: string;
}

interface DuplicateProposalUseCaseResponse {
  proposal: ProposalDTO;
}

export class DuplicateProposalUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: DuplicateProposalUseCaseRequest,
  ): Promise<DuplicateProposalUseCaseResponse> {
    const originalProposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!originalProposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    const duplicatedProposal = await this.proposalsRepository.create({
      tenantId: input.tenantId,
      customerId: originalProposal.customerId.toString(),
      title: `${originalProposal.title} (copy)`,
      description: originalProposal.description,
      validUntil: originalProposal.validUntil,
      terms: originalProposal.terms,
      totalValue: originalProposal.totalValue,
      createdBy: input.createdBy,
      items: originalProposal.items.map((proposalItem) => ({
        description: proposalItem.description,
        quantity: proposalItem.quantity,
        unitPrice: proposalItem.unitPrice,
        total: proposalItem.total,
      })),
    });

    return {
      proposal: proposalToDTO(duplicatedProposal),
    };
  }
}
