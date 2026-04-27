/**
 * Zod schemas para os 11 endpoints de webhooks outbound — Phase 11 / Plan 11-02.
 */
import { WEBHOOK_EVENT_ALLOWLIST } from '@/lib/events/webhook-events';
import { z } from 'zod';

const allowedEventEnum = z.enum(
  WEBHOOK_EVENT_ALLOWLIST as unknown as [string, ...string[]],
);

// ─── Common DTOs ─────────────────────────────────────────────────────────────

export const webhookEndpointDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  url: z.string(),
  description: z.string().nullable(),
  apiVersion: z.string(),
  subscribedEvents: z.array(z.string()),
  status: z.enum(['ACTIVE', 'PAUSED', 'AUTO_DISABLED']),
  autoDisabledReason: z.enum(['CONSECUTIVE_DEAD', 'HTTP_410_GONE']).nullable(),
  autoDisabledAt: z.string().nullable(),
  consecutiveDeadCount: z.number().int(),
  secretMasked: z.string(),
  secretCurrentCreatedAt: z.string(),
  secretRotationActiveUntil: z.string().nullable(),
  lastSuccessAt: z.string().nullable(),
  lastDeliveryAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const webhookDeliveryDtoSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  endpointId: z.string(),
  eventId: z.string(),
  eventType: z.string(),
  status: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'DEAD']),
  attemptCount: z.number().int(),
  manualReprocessCount: z.number().int(),
  lastManualReprocessAt: z.string().nullable(),
  lastAttemptAt: z.string().nullable(),
  lastHttpStatus: z.number().int().nullable(),
  lastErrorClass: z
    .enum([
      'TIMEOUT',
      'NETWORK',
      'TLS',
      'HTTP_4XX',
      'HTTP_5XX',
      'REDIRECT_BLOCKED',
      'SSRF_BLOCKED',
      'DNS_FAIL',
    ])
    .nullable(),
  lastErrorMessage: z.string().nullable(),
  lastDurationMs: z.number().int().nullable(),
  responseBodyTruncated: z.string().nullable(),
  lastRetryAfterSeconds: z.number().int().nullable(),
  payloadHash: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

// ─── Common params ───────────────────────────────────────────────────────────

export const webhookIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const webhookDeliveryParamsSchema = z.object({
  id: z.string().min(1),
  deliveryId: z.string().min(1),
});

// ─── CREATE ──────────────────────────────────────────────────────────────────

export const createWebhookBodySchema = z.object({
  url: z.string().url().max(2048),
  description: z.string().max(200).optional(),
  subscribedEvents: z.array(allowedEventEnum).min(1),
  apiVersion: z.string().default('2026-04-27'),
});

export const createWebhookResponseSchema = z.object({
  endpoint: webhookEndpointDtoSchema,
  /** Cleartext — UMA VEZ */
  secret: z.string(),
});

// ─── LIST ────────────────────────────────────────────────────────────────────

export const listWebhooksQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'AUTO_DISABLED']).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const listWebhooksResponseSchema = z.object({
  items: z.array(webhookEndpointDtoSchema),
  total: z.number().int(),
  count: z.object({
    active: z.number().int(),
    paused: z.number().int(),
    autoDisabled: z.number().int(),
    total: z.number().int(),
  }),
});

// ─── GET ─────────────────────────────────────────────────────────────────────

export const getWebhookResponseSchema = z.object({
  endpoint: webhookEndpointDtoSchema,
});

// ─── UPDATE ──────────────────────────────────────────────────────────────────

export const updateWebhookBodySchema = z.object({
  description: z.string().max(200).nullable().optional(),
  subscribedEvents: z.array(allowedEventEnum).min(1).optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});

// ─── REGENERATE-SECRET ───────────────────────────────────────────────────────

export const regenerateWebhookSecretResponseSchema = z.object({
  endpoint: webhookEndpointDtoSchema,
  secret: z.string(),
});

// ─── REACTIVATE ──────────────────────────────────────────────────────────────

export const reactivateWebhookResponseSchema = z.object({
  endpoint: webhookEndpointDtoSchema,
});

// ─── LIST DELIVERIES ─────────────────────────────────────────────────────────

export const listDeliveriesQuerySchema = z.object({
  status: z.enum(['PENDING', 'DELIVERED', 'FAILED', 'DEAD']).optional(),
  createdAfter: z.coerce.date().optional(),
  createdBefore: z.coerce.date().optional(),
  eventType: z.string().optional(),
  httpStatus: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const listDeliveriesResponseSchema = z.object({
  items: z.array(webhookDeliveryDtoSchema),
  total: z.number().int(),
  count: z.object({
    pending: z.number().int(),
    delivered: z.number().int(),
    failed: z.number().int(),
    dead: z.number().int(),
    total: z.number().int(),
  }),
});

// ─── REPROCESS ───────────────────────────────────────────────────────────────

export const reprocessDeliveryResponseSchema = z.object({
  deliveryId: z.string(),
  newReprocessCount: z.number().int(),
  enqueued: z.boolean(),
  jobId: z.string(),
});

export const reprocessBulkBodySchema = z.object({
  deliveryIds: z.array(z.string()).min(1).max(100),
});

export const reprocessBulkResponseSchema = z.object({
  enqueued: z.number().int(),
  skippedCap: z.array(z.string()),
  skippedCooldown: z.array(z.string()),
  skippedNotFound: z.array(z.string()),
  errors: z.array(
    z.object({
      deliveryId: z.string(),
      message: z.string(),
    }),
  ),
});

// ─── PING ────────────────────────────────────────────────────────────────────

export const pingWebhookResponseSchema = z.object({
  pingDeliveryId: z.string(),
  jobId: z.string(),
});

// ─── Common error ────────────────────────────────────────────────────────────

export const errorResponseSchema = z.object({
  message: z.string(),
});
