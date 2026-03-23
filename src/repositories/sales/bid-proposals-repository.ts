import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidProposal } from '@/entities/sales/bid-proposal';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidProposalsPaginatedParams {
  tenantId: string;
  bidId: string;
  page: number;
  limit: number;
}

export interface BidProposalsRepository {
  create(proposal: BidProposal): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BidProposal | null>;
  findManyByBidId(
    params: FindManyBidProposalsPaginatedParams,
  ): Promise<PaginatedResult<BidProposal>>;
  save(proposal: BidProposal): Promise<void>;
}
