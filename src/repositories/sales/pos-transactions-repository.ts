import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTransaction } from '@/entities/sales/pos-transaction';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyPosTransactionsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  sessionId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PosTransactionsRepository {
  create(transaction: PosTransaction): Promise<void>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTransaction | null>;
  findByOrderId(
    orderId: string,
    tenantId: string,
  ): Promise<PosTransaction | null>;
  findManyPaginated(
    params: FindManyPosTransactionsPaginatedParams,
  ): Promise<PaginatedResult<PosTransaction>>;
  getNextTransactionNumber(sessionId: string): Promise<number>;
  save(transaction: PosTransaction): Promise<void>;
}
