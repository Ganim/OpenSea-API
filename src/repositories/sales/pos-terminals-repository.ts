import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import type { PaginatedResult } from '@/repositories/pagination-params';

export interface FindManyPosTerminalsPaginatedParams {
  tenantId: string;
  page: number;
  limit: number;
  search?: string;
  mode?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PosTerminalsRepository {
  create(terminal: PosTerminal): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PosTerminal | null>;
  findByTerminalCode(code: string): Promise<PosTerminal | null>;
  findByTotemCode(code: string): Promise<PosTerminal | null>;
  /**
   * Hydrates a list of POS Terminals given their IDs, scoped to a tenant.
   * Used by paginated listings that need to enrich rows with terminal
   * metadata (e.g. `GET /v1/admin/pos/conflicts` — Emporion Plan A Task 30).
   * Skips soft-deleted rows by default. IDs that do not belong to the tenant
   * (or are soft-deleted) are silently omitted from the result.
   */
  findManyByIds(
    ids: UniqueEntityID[],
    tenantId: string,
    includeDeleted?: boolean,
  ): Promise<PosTerminal[]>;
  findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>>;
  generateUniqueTerminalCode(): Promise<string>;
  generateUniqueTotemCode(): Promise<string>;
  save(terminal: PosTerminal): Promise<void>;
  softDelete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
