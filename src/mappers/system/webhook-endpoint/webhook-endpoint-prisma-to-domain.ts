/**
 * WebhookEndpoint Prisma row → domain entity mapper.
 * Phase 11 / Plan 11-02.
 */
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  WebhookEndpoint,
  type WebhookAutoDisableReason,
  type WebhookEndpointStatus,
} from '@/entities/system/webhook-endpoint';
import type { WebhookEndpoint as PrismaWebhookEndpoint } from '@prisma/generated/client.js';

export function webhookEndpointPrismaToDomain(
  raw: PrismaWebhookEndpoint,
): WebhookEndpoint {
  return WebhookEndpoint.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      url: raw.url,
      description: raw.description ?? null,
      apiVersion: raw.apiVersion,
      subscribedEvents: raw.subscribedEvents,
      status: raw.status as WebhookEndpointStatus,
      autoDisabledReason:
        (raw.autoDisabledReason as WebhookAutoDisableReason | null) ?? null,
      autoDisabledAt: raw.autoDisabledAt ?? null,
      consecutiveDeadCount: raw.consecutiveDeadCount,
      secretCurrent: raw.secretCurrent,
      secretCurrentLast4: raw.secretCurrentLast4,
      secretCurrentCreatedAt: raw.secretCurrentCreatedAt,
      secretPrevious: raw.secretPrevious ?? null,
      secretPreviousExpiresAt: raw.secretPreviousExpiresAt ?? null,
      lastSuccessAt: raw.lastSuccessAt ?? null,
      lastDeliveryAt: raw.lastDeliveryAt ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
      deletedAt: raw.deletedAt ?? null,
    },
    new UniqueEntityID(raw.id),
  );
}
