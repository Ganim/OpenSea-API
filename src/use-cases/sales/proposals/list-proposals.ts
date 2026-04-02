import type { ProposalStatus } from '@/entities/sales/proposal';
import type { ProposalDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import { proposalToDTO } from '@/mappers/sales/proposal/proposal-to-dto';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';

interface ListProposalsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: ProposalStatus;
  customerId?: string;
}

interface ListProposalsUseCaseResponse {
  proposals: ProposalDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListProposalsUseCase {
  constructor(private proposalsRepository: ProposalsRepository) {}

  async execute(
    input: ListProposalsUseCaseRequest,
  ): Promise<ListProposalsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const filters = {
      status: input.status,
      customerId: input.customerId,
    };

    const [proposals, total] = await Promise.all([
      this.proposalsRepository.findMany(page, perPage, input.tenantId, filters),
      this.proposalsRepository.countMany(input.tenantId, filters),
    ]);

    return {
      proposals: proposals.map(proposalToDTO),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
