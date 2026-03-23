import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bid } from '@/entities/sales/bid';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  modality?: string;
  organState?: string;
  assignedToUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BidsRepository {
  create(bid: Bid): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Bid | null>;
  findManyPaginated(
    params: FindManyBidsPaginatedParams,
  ): Promise<PaginatedResult<Bid>>;
  save(bid: Bid): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
