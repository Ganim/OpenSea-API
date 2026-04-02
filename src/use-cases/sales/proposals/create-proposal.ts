import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface CreateProposalItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CreateProposalUseCaseRequest {
  tenantId: string;
  customerId: string;
  title: string;
  description?: string;
  validUntil?: Date;
  terms?: string;
  createdBy: string;
  items: CreateProposalItemInput[];
}

interface CreateProposalUseCaseResponse {
  proposal: ProposalDTO;
}

export class CreateProposalUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: CreateProposalUseCaseRequest,
  ): Promise<CreateProposalUseCaseResponse> {
    if (!input.title || input.title.trim().length === 0) {
      throw new BadRequestError('Proposal title is required.');
    }

    if (input.title.length > 255) {
      throw new BadRequestError('Proposal title cannot exceed 255 characters.');
    }

    if (!input.items || input.items.length === 0) {
      throw new BadRequestError('Proposal must have at least one item.');
    }

    const calculatedItems = input.items.map((proposalItem) => {
      if (proposalItem.quantity <= 0) {
        throw new BadRequestError('Item quantity must be greater than zero.');
      }
      if (proposalItem.unitPrice < 0) {
        throw new BadRequestError('Item unit price cannot be negative.');
      }

      const itemTotal = proposalItem.quantity * proposalItem.unitPrice;

      return {
        description: proposalItem.description,
        quantity: proposalItem.quantity,
        unitPrice: proposalItem.unitPrice,
        total: itemTotal,
      };
    });

    const totalValue = calculatedItems.reduce(
      (sum, proposalItem) => sum + proposalItem.total,
      0,
    );

    const proposal = await this.proposalsRepository.create({
      tenantId: input.tenantId,
      customerId: input.customerId,
      title: input.title.trim(),
      description: input.description,
      validUntil: input.validUntil,
      terms: input.terms,
      totalValue,
      createdBy: input.createdBy,
      items: calculatedItems,
    });

    return {
      proposal: proposalToDTO(proposal),
    };
  }
}
