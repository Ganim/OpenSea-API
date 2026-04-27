/**
 * In-memory WebhookEndpoint repository — Phase 11 / Plan 11-02.
 * Espelha a semântica do PrismaWebhookEndpointsRepository para tests unit.
 */
import type {
  WebhookAutoDisableReason,
  WebhookEndpoint,
} from '@/entities/system/webhook-endpoint';
import type {
  FindWebhookEndpointsParams,
  FindWebhookEndpointsResult,
  UpdateWebhookEndpointPatch,
  WebhookEndpointsRepository,
} from '../webhook-endpoints-repository';

export class InMemoryWebhookEndpointsRepository implements WebhookEndpointsRepository {
  public items: WebhookEndpoint[] = [];

  async create(endpoint: WebhookEndpoint): Promise<void> {
    this.items.push(endpoint);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<WebhookEndpoint | null> {
    return (
      this.items.find(
        (e) =>
          e.id.toString() === id &&
          e.tenantId.toString() === tenantId &&
          !e.deletedAt,
      ) ?? null
    );
  }

  async findActiveByTenantAndEvent(
    tenantId: string,
    eventType: string,
  ): Promise<WebhookEndpoint[]> {
    return this.items.filter(
      (e) =>
        e.tenantId.toString() === tenantId &&
        e.status === 'ACTIVE' &&
        !e.deletedAt &&
        e.subscribedEvents.includes(eventType),
    );
  }

  async findAll(
    params: FindWebhookEndpointsParams,
  ): Promise<FindWebhookEndpointsResult> {
    const tenantItems = this.items.filter(
      (e) => e.tenantId.toString() === params.tenantId && !e.deletedAt,
    );

    let filtered = tenantItems;
    if (params.status) {
      filtered = filtered.filter((e) => e.status === params.status);
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.url.toLowerCase().includes(q) ||
          (e.description?.toLowerCase().includes(q) ?? false),
      );
    }

    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const items = sorted.slice(params.offset, params.offset + params.limit);

    const count = {
      active: tenantItems.filter((e) => e.status === 'ACTIVE').length,
      paused: tenantItems.filter((e) => e.status === 'PAUSED').length,
      autoDisabled: tenantItems.filter((e) => e.status === 'AUTO_DISABLED')
        .length,
      total: tenantItems.length,
    };

    return { items, total: filtered.length, count };
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (e) =>
        e.tenantId.toString() === tenantId &&
        !e.deletedAt &&
        e.status !== 'AUTO_DISABLED',
    ).length;
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateWebhookEndpointPatch,
  ): Promise<void> {
    const idx = this.items.findIndex(
      (e) => e.id.toString() === id && e.tenantId.toString() === tenantId,
    );
    if (idx === -1) return;
    const e = this.items[idx];
    // Mutate via the entity's props (in-memory analog only — Prisma path is canonical)
    if (data.description !== undefined) e.description = data.description;
    if (data.subscribedEvents !== undefined)
      e.subscribedEvents = data.subscribedEvents;
    // For status changes, use entity methods (handle side-effects)
    if (data.status === 'PAUSED') e.pause();
    if (data.status === 'ACTIVE') e.activate();
    if (data.deletedAt !== undefined) e.deletedAt = data.deletedAt;
    // Direct prop overrides for fields without semantic methods (for worker rollback paths)
    if (data.consecutiveDeadCount !== undefined)
      e.props.consecutiveDeadCount = data.consecutiveDeadCount;
    if (data.lastDeliveryAt !== undefined)
      e.props.lastDeliveryAt = data.lastDeliveryAt;
    if (data.lastSuccessAt !== undefined)
      e.props.lastSuccessAt = data.lastSuccessAt;
    if (data.secretCurrent !== undefined)
      e.props.secretCurrent = data.secretCurrent;
    if (data.secretCurrentLast4 !== undefined)
      e.props.secretCurrentLast4 = data.secretCurrentLast4;
    if (data.secretCurrentCreatedAt !== undefined)
      e.props.secretCurrentCreatedAt = data.secretCurrentCreatedAt;
    if (data.secretPrevious !== undefined)
      e.props.secretPrevious = data.secretPrevious;
    if (data.secretPreviousExpiresAt !== undefined)
      e.props.secretPreviousExpiresAt = data.secretPreviousExpiresAt;
  }

  async incrementDeadCount(
    id: string,
    tenantId: string,
  ): Promise<{ newCount: number }> {
    const e = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!e) return { newCount: 0 };
    const r = e.incrementDeadCount();
    return { newCount: r.newCount };
  }

  async resetDeadCount(id: string, tenantId: string): Promise<void> {
    const e = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!e) return;
    e.resetDeadCount();
  }

  async autoDisable(
    id: string,
    tenantId: string,
    reason: WebhookAutoDisableReason,
  ): Promise<void> {
    const e = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!e) return;
    e.autoDisable(reason);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const e = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!e) return;
    e.deletedAt = new Date();
  }

  async cleanupExpiredPreviousSecrets(): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const e of this.items) {
      const exp = e.secretPreviousExpiresAt;
      if (exp && exp < now && e.secretPrevious) {
        e.props.secretPrevious = null;
        e.props.secretPreviousExpiresAt = null;
        count++;
      }
    }
    return count;
  }
}
