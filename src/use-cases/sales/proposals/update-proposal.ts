import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface UpdateProposalItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface UpdateProposalUseCaseRequest {
  tenantId: string;
  id: string;
  customerId?: string;
  title?: string;
  description?: string | null;
  validUntil?: Date | null;
  terms?: string | null;
  items?: UpdateProposalItemInput[];
}

interface UpdateProposalUseCaseResponse {
  proposal: ProposalDTO;
}

export class UpdateProposalUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: UpdateProposalUseCaseRequest,
  ): Promise<UpdateProposalUseCaseResponse> {
    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(input.id),
      input.tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    if (proposal.status !== 'DRAFT') {
      throw new BadRequestError(
        'Only proposals in DRAFT status can be updated.',
      );
    }

    if (input.title !== undefined) {
      if (input.title.trim().length === 0) {
        throw new BadRequestError('Proposal title is required.');
      }
      if (input.title.length > 255) {
        throw new BadRequestError(
          'Proposal title cannot exceed 255 characters.',
        );
      }
      proposal.title = input.title.trim();
    }

    if (input.customerId !== undefined) {
      proposal.customerId = new UniqueEntityID(input.customerId);
    }

    if (input.description !== undefined) {
      proposal.description = input.description ?? undefined;
    }

    if (input.validUntil !== undefined) {
      proposal.validUntil = input.validUntil ?? undefined;
    }

    if (input.terms !== undefined) {
      proposal.terms = input.terms ?? undefined;
    }

    if (input.items !== undefined) {
      if (input.items.length === 0) {
        throw new BadRequestError('Proposal must have at least one item.');
      }

      const calculatedItems = input.items.map((proposalItem) => {
        if (proposalItem.quantity <= 0) {
          throw new BadRequestError('Item quantity must be greater than zero.');
        }
        if (proposalItem.unitPrice < 0) {
          throw new BadRequestError('Item unit price cannot be negative.');
        }

        return {
          id: new UniqueEntityID(),
          proposalId: proposal.id,
          description: proposalItem.description,
          quantity: proposalItem.quantity,
          unitPrice: proposalItem.unitPrice,
          total: proposalItem.quantity * proposalItem.unitPrice,
          createdAt: new Date(),
        };
      });

      proposal.items = calculatedItems;
      proposal.totalValue = calculatedItems.reduce(
        (sum, proposalItem) => sum + proposalItem.total,
        0,
      );
    }

    await this.proposalsRepository.save(proposal);

    return {
      proposal: proposalToDTO(proposal),
    };
  }
}
