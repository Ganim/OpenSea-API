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
  findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>>;
  generateUniqueTerminalCode(): Promise<string>;
  generateUniqueTotemCode(): Promise<string>;
  save(terminal: PosTerminal): Promise<void>;
  softDelete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
