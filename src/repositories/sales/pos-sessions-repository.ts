import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosSession } from '@/entities/sales/pos-session';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyPosSessionsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  terminalId?: string;
  status?: string;
  operatorUserId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PosSessionsRepository {
  create(session: PosSession): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PosSession | null>;
  findActiveByTerminal(terminalId: string, tenantId: string): Promise<PosSession | null>;
  findManyPaginated(
    params: FindManyPosSessionsPaginatedParams,
  ): Promise<PaginatedResult<PosSession>>;
  save(session: PosSession): Promise<void>;
}
