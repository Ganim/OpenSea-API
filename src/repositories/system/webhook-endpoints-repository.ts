/**
 * WebhookEndpoint repository interface — Phase 11 / Plan 11-02.
 */
import type {
  WebhookAutoDisableReason,
  WebhookEndpoint,
  WebhookEndpointStatus,
} from '@/entities/system/webhook-endpoint';

export interface FindWebhookEndpointsParams {
  tenantId: string;
  status?: WebhookEndpointStatus;
  search?: string;
  limit: number;
  offset: number;
}

export interface FindWebhookEndpointsResult {
  items: WebhookEndpoint[];
  total: number;
  count: {
    active: number;
    paused: number;
    autoDisabled: number;
    total: number;
  };
}

export interface UpdateWebhookEndpointPatch {
  description?: string | null;
  subscribedEvents?: string[];
  status?: WebhookEndpointStatus;
  autoDisabledReason?: WebhookAutoDisableReason | null;
  autoDisabledAt?: Date | null;
  consecutiveDeadCount?: number;
  secretCurrent?: string;
  secretCurrentLast4?: string;
  secretCurrentCreatedAt?: Date;
  secretPrevious?: string | null;
  secretPreviousExpiresAt?: Date | null;
  lastSuccessAt?: Date | null;
  lastDeliveryAt?: Date | null;
  deletedAt?: Date | null;
}

export interface WebhookEndpointsRepository {
  create(endpoint: WebhookEndpoint): Promise<void>;
  findById(id: string, tenantId: string): Promise<WebhookEndpoint | null>;
  findActiveByTenantAndEvent(
    tenantId: string,
    eventType: string,
  ): Promise<WebhookEndpoint[]>;
  findAll(
    params: FindWebhookEndpointsParams,
  ): Promise<FindWebhookEndpointsResult>;
  /** Para D-34 — cap 50 endpoints/tenant */
  countActiveByTenant(tenantId: string): Promise<number>;
  update(
    id: string,
    tenantId: string,
    data: UpdateWebhookEndpointPatch,
  ): Promise<void>;
  /** Atomic SQL increment (sobrevive concurrent worker dispatch) */
  incrementDeadCount(
    id: string,
    tenantId: string,
  ): Promise<{ newCount: number }>;
  resetDeadCount(id: string, tenantId: string): Promise<void>;
  autoDisable(
    id: string,
    tenantId: string,
    reason: WebhookAutoDisableReason,
  ): Promise<void>;
  /** Soft-delete via deletedAt (cascade FK trata WebhookDelivery) */
  delete(id: string, tenantId: string): Promise<void>;
  /** Limpa secretPrevious expirados (chamado pelo cleanup scheduler) — retorna count */
  cleanupExpiredPreviousSecrets(): Promise<number>;
}
