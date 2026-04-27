/**
 * WebhookEndpoint domain entity → public DTO mapper.
 * Phase 11 / Plan 11-02 / D-08 (LGPD sentinel — secret cleartext NUNCA exposto).
 *
 * Sentinela: JSON.stringify(dto) NÃO deve fazer match com /whsec_[A-Za-z0-9_-]{30,}/
 * — apenas o secretMasked formato `whsec_••••••••<last4>` é aceito.
 */
import type {
  WebhookEndpoint,
  WebhookEndpointStatus,
  WebhookAutoDisableReason,
} from '@/entities/system/webhook-endpoint';

export interface WebhookEndpointDTO {
  id: string;
  tenantId: string;
  url: string;
  description: string | null;
  apiVersion: string;
  subscribedEvents: string[];
  status: WebhookEndpointStatus;
  autoDisabledReason: WebhookAutoDisableReason | null;
  autoDisabledAt: string | null;
  consecutiveDeadCount: number;
  /** `whsec_••••••••<last4>` — última 4 chars apenas (D-08) */
  secretMasked: string;
  secretCurrentCreatedAt: string;
  /** Janela de rotação ativa (D-07) — null se não está rotacionando */
  secretRotationActiveUntil: string | null;
  lastSuccessAt: string | null;
  lastDeliveryAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  // PROIBIDO: secretCurrent, secretPrevious (cleartext) — sentinel LGPD
}

export function webhookEndpointToDto(e: WebhookEndpoint): WebhookEndpointDTO {
  return {
    id: e.id.toString(),
    tenantId: e.tenantId.toString(),
    url: e.url,
    description: e.description,
    apiVersion: e.apiVersion,
    subscribedEvents: e.subscribedEvents,
    status: e.status,
    autoDisabledReason: e.autoDisabledReason,
    autoDisabledAt: e.autoDisabledAt?.toISOString() ?? null,
    consecutiveDeadCount: e.consecutiveDeadCount,
    secretMasked: `whsec_••••••••${e.secretCurrentLast4}`,
    secretCurrentCreatedAt: e.secretCurrentCreatedAt.toISOString(),
    secretRotationActiveUntil: e.secretPreviousExpiresAt?.toISOString() ?? null,
    lastSuccessAt: e.lastSuccessAt?.toISOString() ?? null,
    lastDeliveryAt: e.lastDeliveryAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt?.toISOString() ?? null,
  };
}
