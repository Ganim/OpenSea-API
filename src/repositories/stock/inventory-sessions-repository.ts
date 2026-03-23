import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  InventorySession,
  InventorySessionMode,
  InventorySessionStatus,
} from '@/entities/stock/inventory-session';
import type { PaginatedResult, PaginationParams } from '../pagination-params';

export interface CreateInventorySessionSchema {
  tenantId: string;
  userId: UniqueEntityID;
  mode: InventorySessionMode;
  binId?: UniqueEntityID;
  zoneId?: UniqueEntityID;
  productId?: UniqueEntityID;
  variantId?: UniqueEntityID;
  totalItems?: number;
  notes?: string;
}

export interface InventorySessionFilters {
  status?: InventorySessionStatus;
  mode?: InventorySessionMode;
}

export interface InventorySessionsRepository {
  create(data: CreateInventorySessionSchema): Promise<InventorySession>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InventorySession | null>;
  findActiveByScope(
    tenantId: string,
    mode: InventorySessionMode,
    scopeId: UniqueEntityID,
  ): Promise<InventorySession | null>;
  findManyPaginated(
    tenantId: string,
    params: PaginationParams,
    filters?: InventorySessionFilters,
  ): Promise<PaginatedResult<InventorySession>>;
  save(session: InventorySession): Promise<void>;
}
