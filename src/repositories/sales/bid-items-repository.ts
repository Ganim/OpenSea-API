import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidItem } from '@/entities/sales/bid-item';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidItemsPaginatedParams {
  tenantId: string;
  bidId: string;
  page: number;
  limit: number;
  status?: string;
}

export interface BidItemsRepository {
  create(item: BidItem): Promise<void>;
  createMany(items: BidItem[]): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BidItem | null>;
  findManyByBidId(
    params: FindManyBidItemsPaginatedParams,
  ): Promise<PaginatedResult<BidItem>>;
  save(item: BidItem): Promise<void>;
  deleteByBidId(bidId: string, tenantId: string): Promise<void>;
}
