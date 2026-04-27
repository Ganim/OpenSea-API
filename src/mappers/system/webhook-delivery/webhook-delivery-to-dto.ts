/**
 * WebhookDelivery domain entity → public DTO mapper.
 * Phase 11 / Plan 11-02 / D-29 (1KB truncate) + Pitfall 5 (secret eco sanitize).
 */
import type {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookErrorClass,
} from '@/entities/system/webhook-delivery';

const MAX_RESPONSE_BODY_CHARS = 1024;
const SECRET_ECO_REGEX = /whsec_[A-Za-z0-9_-]+/g;

/**
 * Sanitiza echoes do customer endpoint que tenham gravado o secret cleartext
 * em error messages ou response bodies (Pitfall 5).
 */
function sanitizeSecretEcho(value: string | null): string | null {
  if (!value) return value;
  return value.replace(SECRET_ECO_REGEX, 'whsec_••••');
}

/**
 * Mascarar header X-OpenSea-Signature: mostra primeiros 8 chars do hex
 * v1=<hex> + reticências. Útil para audit/UI sem expor o HMAC completo.
 */
export function maskSignatureHeader(
  signatureHeader: string | null,
): string | null {
  if (!signatureHeader) return null;
  // Format: t=<unix>,v1=<hex>
  return signatureHeader.replace(/v1=([a-f0-9]{8})[a-f0-9]+/i, 'v1=$1...');
}

export interface WebhookDeliveryDTO {
  id: string;
  tenantId: string;
  endpointId: string;
  eventId: string;
  eventType: string;
  status: WebhookDeliveryStatus;
  attemptCount: number;
  manualReprocessCount: number;
  lastManualReprocessAt: string | null;
  lastAttemptAt: string | null;
  lastHttpStatus: number | null;
  lastErrorClass: WebhookErrorClass | null;
  lastErrorMessage: string | null;
  lastDurationMs: number | null;
  /** Truncado em 1024 chars + sanitizado (whsec_*) */
  responseBodyTruncated: string | null;
  lastRetryAfterSeconds: number | null;
  payloadHash: string;
  createdAt: string;
  updatedAt: string | null;
}

export function webhookDeliveryToDto(d: WebhookDelivery): WebhookDeliveryDTO {
  const sanitizedError = sanitizeSecretEcho(d.lastErrorMessage);

  let responseBody = d.lastResponseBody;
  if (responseBody && responseBody.length > MAX_RESPONSE_BODY_CHARS) {
    responseBody = responseBody.slice(0, MAX_RESPONSE_BODY_CHARS);
  }
  const sanitizedBody = sanitizeSecretEcho(responseBody);

  return {
    id: d.id.toString(),
    tenantId: d.tenantId.toString(),
    endpointId: d.endpointId.toString(),
    eventId: d.eventId,
    eventType: d.eventType,
    status: d.status,
    attemptCount: d.attemptCount,
    manualReprocessCount: d.manualReprocessCount,
    lastManualReprocessAt: d.lastManualReprocessAt?.toISOString() ?? null,
    lastAttemptAt: d.lastAttemptAt?.toISOString() ?? null,
    lastHttpStatus: d.lastHttpStatus,
    lastErrorClass: d.lastErrorClass,
    lastErrorMessage: sanitizedError,
    lastDurationMs: d.lastDurationMs,
    responseBodyTruncated: sanitizedBody,
    lastRetryAfterSeconds: d.lastRetryAfterSeconds,
    payloadHash: d.payloadHash,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt?.toISOString() ?? null,
  };
}
