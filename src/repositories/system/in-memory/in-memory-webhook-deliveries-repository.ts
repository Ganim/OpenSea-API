/**
 * In-memory WebhookDelivery repository — Phase 11 / Plan 11-02.
 */
import type {
  AttemptLog,
  WebhookDelivery,
} from '@/entities/system/webhook-delivery';
import type {
  FindWebhookDeliveriesParams,
  FindWebhookDeliveriesResult,
  UpdateWebhookDeliveryPatch,
  WebhookDeliveriesRepository,
} from '../webhook-deliveries-repository';

export class InMemoryWebhookDeliveriesRepository implements WebhookDeliveriesRepository {
  public items: WebhookDelivery[] = [];

  async create(delivery: WebhookDelivery): Promise<void> {
    this.items.push(delivery);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<WebhookDelivery | null> {
    return (
      this.items.find(
        (d) => d.id.toString() === id && d.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByEventAndEndpoint(
    eventId: string,
    endpointId: string,
  ): Promise<WebhookDelivery | null> {
    return (
      this.items.find(
        (d) => d.eventId === eventId && d.endpointId.toString() === endpointId,
      ) ?? null
    );
  }

  async findAll(
    params: FindWebhookDeliveriesParams,
  ): Promise<FindWebhookDeliveriesResult> {
    const scoped = this.items.filter(
      (d) =>
        d.tenantId.toString() === params.tenantId &&
        d.endpointId.toString() === params.endpointId,
    );

    let filtered = scoped;
    if (params.status) {
      filtered = filtered.filter((d) => d.status === params.status);
    }
    if (params.createdAfter) {
      const after = params.createdAfter;
      filtered = filtered.filter((d) => d.createdAt >= after);
    }
    if (params.createdBefore) {
      const before = params.createdBefore;
      filtered = filtered.filter((d) => d.createdAt <= before);
    }
    if (params.eventType) {
      filtered = filtered.filter((d) => d.eventType === params.eventType);
    }
    if (params.httpStatus !== undefined) {
      filtered = filtered.filter((d) => d.lastHttpStatus === params.httpStatus);
    }

    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const items = sorted.slice(params.offset, params.offset + params.limit);

    const count = {
      pending: scoped.filter((d) => d.status === 'PENDING').length,
      delivered: scoped.filter((d) => d.status === 'DELIVERED').length,
      failed: scoped.filter((d) => d.status === 'FAILED').length,
      dead: scoped.filter((d) => d.status === 'DEAD').length,
      total: scoped.length,
    };

    return { items, total: filtered.length, count };
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateWebhookDeliveryPatch,
  ): Promise<void> {
    const d = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!d) return;
    if (data.status !== undefined) d.props.status = data.status;
    if (data.attemptCount !== undefined)
      d.props.attemptCount = data.attemptCount;
    if (data.manualReprocessCount !== undefined)
      d.props.manualReprocessCount = data.manualReprocessCount;
    if (data.lastManualReprocessAt !== undefined)
      d.props.lastManualReprocessAt = data.lastManualReprocessAt;
    if (data.lastAttemptAt !== undefined)
      d.props.lastAttemptAt = data.lastAttemptAt;
    if (data.lastHttpStatus !== undefined)
      d.props.lastHttpStatus = data.lastHttpStatus;
    if (data.lastErrorClass !== undefined)
      d.props.lastErrorClass = data.lastErrorClass;
    if (data.lastErrorMessage !== undefined)
      d.props.lastErrorMessage = data.lastErrorMessage;
    if (data.lastDurationMs !== undefined)
      d.props.lastDurationMs = data.lastDurationMs;
    if (data.lastResponseBody !== undefined)
      d.props.lastResponseBody = data.lastResponseBody;
    if (data.lastRetryAfterSeconds !== undefined)
      d.props.lastRetryAfterSeconds = data.lastRetryAfterSeconds;
  }

  async appendAttempt(
    id: string,
    tenantId: string,
    attempt: AttemptLog,
  ): Promise<void> {
    const d = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!d) return;
    d.recordAttempt(attempt);
  }

  async incrementManualReprocess(
    id: string,
    tenantId: string,
  ): Promise<{ newCount: number; lastReprocessAt: Date }> {
    const d = this.items.find(
      (i) => i.id.toString() === id && i.tenantId.toString() === tenantId,
    );
    if (!d) {
      return { newCount: 0, lastReprocessAt: new Date() };
    }
    const r = d.incrementManualReprocess();
    return {
      newCount: r.newCount,
      lastReprocessAt: d.lastManualReprocessAt ?? new Date(),
    };
  }

  async cleanupDeadOlderThan(date: Date): Promise<number> {
    const before = this.items.length;
    this.items = this.items.filter(
      (d) => !(d.status === 'DEAD' && d.createdAt < date),
    );
    return before - this.items.length;
  }
}
