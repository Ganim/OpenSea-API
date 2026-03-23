import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidDocument } from '@/entities/sales/bid-document';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidDocumentsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  bidId?: string;
  type?: string;
}

export interface BidDocumentsRepository {
  create(doc: BidDocument): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BidDocument | null>;
  findManyPaginated(
    params: FindManyBidDocumentsPaginatedParams,
  ): Promise<PaginatedResult<BidDocument>>;
  save(doc: BidDocument): Promise<void>;
}
