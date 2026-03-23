import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidProposal } from '@/entities/sales/bid-proposal';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  BidProposalsRepository,
  FindManyBidProposalsPaginatedParams,
} from '@/repositories/sales/bid-proposals-repository';

export class InMemoryBidProposalsRepository implements BidProposalsRepository {
  public items: BidProposal[] = [];

  async create(proposal: BidProposal): Promise<void> {
    this.items.push(proposal);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BidProposal | null> {
    return (
      this.items.find(
        (p) =>
          p.id.toString() === id.toString() &&
          p.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByBidId(
    params: FindManyBidProposalsPaginatedParams,
  ): Promise<PaginatedResult<BidProposal>> {
    const filtered = this.items.filter(
      (p) =>
        p.tenantId.toString() === params.tenantId &&
        p.bidId.toString() === params.bidId,
    );

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(proposal: BidProposal): Promise<void> {
    const index = this.items.findIndex(
      (p) => p.id.toString() === proposal.id.toString(),
    );
    if (index !== -1) {
      this.items[index] = proposal;
    }
  }
}
