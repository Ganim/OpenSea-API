import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InventorySession } from '@/entities/stock/inventory-session';
import type { InventorySessionItem } from '@/entities/stock/inventory-session-item';

export interface InventorySessionsRepository {
  create(session: InventorySession): Promise<InventorySession>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InventorySession | null>;
  findActiveByScope(
    scope: Record<string, string>,
    tenantId: string,
  ): Promise<InventorySession | null>;
  list(params: {
    tenantId: string;
    status?: string;
    mode?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ sessions: InventorySession[]; total: number }>;
  save(session: InventorySession): Promise<void>;
  createItem(item: InventorySessionItem): Promise<InventorySessionItem>;
  findItemsBySessionId(sessionId: string): Promise<InventorySessionItem[]>;
  saveItem(item: InventorySessionItem): Promise<void>;
}
