import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  InventorySession,
  type InventorySessionMode,
  type InventorySessionStatus,
} from '@/entities/stock/inventory-session';
import { InventorySessionItem } from '@/entities/stock/inventory-session-item';

import type { InventorySessionsRepository } from '../inventory-sessions-repository';

export class InMemoryInventorySessionsRepository
  implements InventorySessionsRepository
{
  public sessions: InventorySession[] = [];
  public sessionItems: InventorySessionItem[] = [];

  async create(session: InventorySession): Promise<InventorySession> {
    this.sessions.push(session);
    return session;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InventorySession | null> {
    const session = this.sessions.find(
      (s) =>
        s.id.equals(id) &&
        s.tenantId.toString() === tenantId &&
        !s.deletedAt,
    );
    return session ?? null;
  }

  async findActiveByScope(
    scope: Record<string, string>,
    tenantId: string,
  ): Promise<InventorySession | null> {
    const session = this.sessions.find((s) => {
      if (s.tenantId.toString() !== tenantId) return false;
      if (s.deletedAt) return false;
      if (s.status !== 'OPEN' && s.status !== 'PAUSED') return false;

      // Compare scope objects
      const sessionScope = s.scope;
      const scopeKeys = Object.keys(scope);
      const sessionScopeKeys = Object.keys(sessionScope);
      if (scopeKeys.length !== sessionScopeKeys.length) return false;

      return scopeKeys.every(
        (key) => String(sessionScope[key]) === scope[key],
      );
    });
    return session ?? null;
  }

  async list(params: {
    tenantId: string;
    status?: string;
    mode?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ sessions: InventorySession[]; total: number }> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;

    let filtered = this.sessions.filter(
      (s) => s.tenantId.toString() === params.tenantId && !s.deletedAt,
    );

    if (params.status) {
      filtered = filtered.filter(
        (s) => s.status === (params.status as InventorySessionStatus),
      );
    }

    if (params.mode) {
      filtered = filtered.filter(
        (s) => s.mode === (params.mode as InventorySessionMode),
      );
    }

    // Sort by createdAt descending
    filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const total = filtered.length;
    const start = (page - 1) * perPage;
    const sessions = filtered.slice(start, start + perPage);

    return { sessions, total };
  }

  async save(session: InventorySession): Promise<void> {
    const index = this.sessions.findIndex((s) => s.id.equals(session.id));
    if (index >= 0) {
      this.sessions[index] = session;
    } else {
      this.sessions.push(session);
    }
  }

  async createItem(
    item: InventorySessionItem,
  ): Promise<InventorySessionItem> {
    this.sessionItems.push(item);
    return item;
  }

  async findItemsBySessionId(
    sessionId: string,
  ): Promise<InventorySessionItem[]> {
    return this.sessionItems
      .filter((i) => i.sessionId === sessionId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async saveItem(item: InventorySessionItem): Promise<void> {
    const index = this.sessionItems.findIndex((i) => i.id.equals(item.id));
    if (index >= 0) {
      this.sessionItems[index] = item;
    } else {
      this.sessionItems.push(item);
    }
  }
}
