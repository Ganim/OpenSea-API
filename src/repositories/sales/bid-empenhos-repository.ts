import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BidEmpenho } from '@/entities/sales/bid-empenho';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyBidEmpenhosPaginatedParams {
  tenantId: string;
  contractId: string;
  page: number;
  limit: number;
  status?: string;
}

export interface BidEmpenhosRepository {
  create(empenho: BidEmpenho): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<BidEmpenho | null>;
  findByNumber(
    empenhoNumber: string,
    tenantId: string,
  ): Promise<BidEmpenho | null>;
  findManyByContractId(
    params: FindManyBidEmpenhosPaginatedParams,
  ): Promise<PaginatedResult<BidEmpenho>>;
  save(empenho: BidEmpenho): Promise<void>;
}
