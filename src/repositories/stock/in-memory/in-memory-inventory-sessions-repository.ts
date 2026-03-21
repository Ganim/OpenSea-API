import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  InventorySession,
  type InventorySessionMode,
} from '@/entities/stock/inventory-session';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  CreateInventorySessionSchema,
  InventorySessionFilters,
  InventorySessionsRepository,
} from '../inventory-sessions-repository';

export class InMemoryInventorySessionsRepository
  implements InventorySessionsRepository
{
  public sessions: InventorySession[] = [];

  async create(data: CreateInventorySessionSchema): Promise<InventorySession> {
    const session = InventorySession.create({
      tenantId: new UniqueEntityID(data.tenantId),
      userId: data.userId,
      mode: data.mode,
      binId: data.binId,
      zoneId: data.zoneId,
      productId: data.productId,
      variantId: data.variantId,
      totalItems: data.totalItems ?? 0,
      notes: data.notes,
    });

    this.sessions.push(session);
    return session;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InventorySession | null> {
    const session = this.sessions.find(
      (s) => s.id.equals(id) && s.tenantId.toString() === tenantId,
    );
    return session ?? null;
  }

  async findActiveByScope(
    tenantId: string,
    mode: InventorySessionMode,
    scopeId: UniqueEntityID,
  ): Promise<InventorySession | null> {
    const session = this.sessions.find((s) => {
      if (s.tenantId.toString() !== tenantId) return false;
      if (!s.isActive) return false;
      if (s.mode !== mode) return false;

      switch (mode) {
        case 'BIN':
          return s.binId?.equals(scopeId) ?? false;
        case 'ZONE':
          return s.zoneId?.equals(scopeId) ?? false;
        case 'PRODUCT':
          return (
            (s.productId?.equals(scopeId) ?? false) ||
            (s.variantId?.equals(scopeId) ?? false)
          );
        default:
          return false;
      }
    });
    return session ?? null;
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams,
    filters?: InventorySessionFilters,
  ): Promise<PaginatedResult<InventorySession>> {
    let filtered = this.sessions.filter(
      (s) => s.tenantId.toString() === tenantId,
    );

    if (filters?.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }
    if (filters?.mode) {
      filtered = filtered.filter((s) => s.mode === filters.mode);
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const data = filtered.slice(start, start + params.limit);

    return {
      data,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(session: InventorySession): Promise<void> {
    const index = this.sessions.findIndex((s) => s.id.equals(session.id));
    if (index >= 0) {
      this.sessions[index] = session;
    } else {
      this.sessions.push(session);
    }
  }
}
