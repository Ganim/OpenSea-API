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
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PosTerminalsRepository {
  create(terminal: PosTerminal): Promise<void>;
  findById(id: UniqueEntityID, tenantId: string): Promise<PosTerminal | null>;
  findByDeviceId(deviceId: string, tenantId: string): Promise<PosTerminal | null>;
  findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>>;
  save(terminal: PosTerminal): Promise<void>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
