/**
 * WebhookDelivery repository interface — Phase 11 / Plan 11-02.
 */
import type {
  AttemptLog,
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookErrorClass,
} from '@/entities/system/webhook-delivery';

export interface FindWebhookDeliveriesParams {
  tenantId: string;
  endpointId: string;
  status?: WebhookDeliveryStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  eventType?: string;
  httpStatus?: number;
  limit: number;
  offset: number;
}

export interface FindWebhookDeliveriesResult {
  items: WebhookDelivery[];
  total: number;
  count: {
    pending: number;
    delivered: number;
    failed: number;
    dead: number;
    total: number;
  };
}

export interface UpdateWebhookDeliveryPatch {
  status?: WebhookDeliveryStatus;
  attemptCount?: number;
  manualReprocessCount?: number;
  lastManualReprocessAt?: Date | null;
  lastAttemptAt?: Date | null;
  lastHttpStatus?: number | null;
  lastErrorClass?: WebhookErrorClass | null;
  lastErrorMessage?: string | null;
  lastDurationMs?: number | null;
  lastResponseBody?: string | null;
  lastRetryAfterSeconds?: number | null;
}

export interface WebhookDeliveriesRepository {
  create(delivery: WebhookDelivery): Promise<void>;
  findById(id: string, tenantId: string): Promise<WebhookDelivery | null>;
  /** Idempotency check — eventos duplicados não devem criar nova delivery */
  findByEventAndEndpoint(
    eventId: string,
    endpointId: string,
  ): Promise<WebhookDelivery | null>;
  findAll(
    params: FindWebhookDeliveriesParams,
  ): Promise<FindWebhookDeliveriesResult>;
  update(
    id: string,
    tenantId: string,
    data: UpdateWebhookDeliveryPatch,
  ): Promise<void>;
  /** Append ao Json[] attempts — atomic via prisma update */
  appendAttempt(
    id: string,
    tenantId: string,
    attempt: AttemptLog,
  ): Promise<void>;
  /** Atomic increment + setLastReprocessAt — D-21 */
  incrementManualReprocess(
    id: string,
    tenantId: string,
  ): Promise<{ newCount: number; lastReprocessAt: Date }>;
  /** Cleanup scheduler — D-23 90d retention para DEAD */
  cleanupDeadOlderThan(date: Date): Promise<number>;
}
