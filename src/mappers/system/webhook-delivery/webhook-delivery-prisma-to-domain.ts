/**
 * WebhookDelivery Prisma row → domain entity mapper.
 * Phase 11 / Plan 11-02.
 */
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  WebhookDelivery,
  type AttemptLog,
  type WebhookDeliveryStatus,
  type WebhookErrorClass,
} from '@/entities/system/webhook-delivery';
import type { WebhookDelivery as PrismaWebhookDelivery } from '@prisma/generated/client.js';

export function webhookDeliveryPrismaToDomain(
  raw: PrismaWebhookDelivery,
): WebhookDelivery {
  const attempts = Array.isArray(raw.attempts)
    ? (raw.attempts as unknown as AttemptLog[])
    : [];

  return WebhookDelivery.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      endpointId: new UniqueEntityID(raw.endpointId),
      eventId: raw.eventId,
      eventType: raw.eventType,
      status: raw.status as WebhookDeliveryStatus,
      attemptCount: raw.attemptCount,
      manualReprocessCount: raw.manualReprocessCount,
      lastManualReprocessAt: raw.lastManualReprocessAt ?? null,
      lastAttemptAt: raw.lastAttemptAt ?? null,
      lastHttpStatus: raw.lastHttpStatus ?? null,
      lastErrorClass: (raw.lastErrorClass as WebhookErrorClass | null) ?? null,
      lastErrorMessage: raw.lastErrorMessage ?? null,
      lastDurationMs: raw.lastDurationMs ?? null,
      lastResponseBody: raw.lastResponseBody ?? null,
      lastRetryAfterSeconds: raw.lastRetryAfterSeconds ?? null,
      attempts,
      payloadHash: raw.payloadHash,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
