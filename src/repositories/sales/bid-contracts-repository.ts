import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidContract } from '@/entities/sales/bid-contract';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidContractsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  status?: string;
  bidId?: string;
}

export interface BidContractsRepository {
  create(contract: BidContract): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BidContract | null>;
  findByNumber(
    contractNumber: string,
    tenantId: string,
  ): Promise<BidContract | null>;
  findManyPaginated(
    params: FindManyBidContractsPaginatedParams,
  ): Promise<PaginatedResult<BidContract>>;
  save(contract: BidContract): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
