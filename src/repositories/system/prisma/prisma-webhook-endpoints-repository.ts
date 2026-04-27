/**
 * Prisma WebhookEndpoint repository — Phase 11 / Plan 11-02.
 *
 * Multi-tenant: toda query filtra por tenantId.
 * Soft-delete: deletedAt: null em listings.
 * Auto-disable: incrementDeadCount usa SQL atomic `{ increment: 1 }` (Pitfall 6).
 */
import type { WebhookEndpoint } from '@/entities/system/webhook-endpoint';
import { prisma } from '@/lib/prisma';
import { webhookEndpointPrismaToDomain } from '@/mappers/system/webhook-endpoint/webhook-endpoint-prisma-to-domain';
import type {
  Prisma,
  WebhookAutoDisableReason as PrismaWebhookAutoDisableReason,
  WebhookEndpointStatus as PrismaWebhookEndpointStatus,
} from '@prisma/generated/client.js';

import type {
  FindWebhookEndpointsParams,
  FindWebhookEndpointsResult,
  UpdateWebhookEndpointPatch,
  WebhookEndpointsRepository,
} from '../webhook-endpoints-repository';

export class PrismaWebhookEndpointsRepository implements WebhookEndpointsRepository {
  async create(endpoint: WebhookEndpoint): Promise<void> {
    await prisma.webhookEndpoint.create({
      data: {
        id: endpoint.id.toString(),
        tenantId: endpoint.tenantId.toString(),
        url: endpoint.url,
        description: endpoint.description ?? null,
        apiVersion: endpoint.apiVersion,
        subscribedEvents: endpoint.subscribedEvents,
        status: endpoint.status as PrismaWebhookEndpointStatus,
        autoDisabledReason:
          (endpoint.autoDisabledReason as PrismaWebhookAutoDisableReason | null) ??
          null,
        autoDisabledAt: endpoint.autoDisabledAt ?? null,
        consecutiveDeadCount: endpoint.consecutiveDeadCount,
        secretCurrent: endpoint.secretCurrent,
        secretCurrentLast4: endpoint.secretCurrentLast4,
        secretCurrentCreatedAt: endpoint.secretCurrentCreatedAt,
        secretPrevious: endpoint.secretPrevious ?? null,
        secretPreviousExpiresAt: endpoint.secretPreviousExpiresAt ?? null,
        lastSuccessAt: endpoint.lastSuccessAt ?? null,
        lastDeliveryAt: endpoint.lastDeliveryAt ?? null,
        createdAt: endpoint.createdAt,
        deletedAt: endpoint.deletedAt ?? null,
      },
    });
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<WebhookEndpoint | null> {
    const raw = await prisma.webhookEndpoint.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? webhookEndpointPrismaToDomain(raw) : null;
  }

  async findActiveByTenantAndEvent(
    tenantId: string,
    eventType: string,
  ): Promise<WebhookEndpoint[]> {
    const rows = await prisma.webhookEndpoint.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        deletedAt: null,
        subscribedEvents: { has: eventType },
      },
    });
    return rows.map(webhookEndpointPrismaToDomain);
  }

  async findAll(
    params: FindWebhookEndpointsParams,
  ): Promise<FindWebhookEndpointsResult> {
    const baseWhere: Prisma.WebhookEndpointWhereInput = {
      tenantId: params.tenantId,
      deletedAt: null,
    };

    const filteredWhere: Prisma.WebhookEndpointWhereInput = { ...baseWhere };
    if (params.status) {
      filteredWhere.status = params.status as PrismaWebhookEndpointStatus;
    }
    if (params.search) {
      filteredWhere.OR = [
        { url: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total, countActive, countPaused, countAutoDisabled, totalAll] =
      await Promise.all([
        prisma.webhookEndpoint.findMany({
          where: filteredWhere,
          orderBy: { createdAt: 'desc' },
          skip: params.offset,
          take: params.limit,
        }),
        prisma.webhookEndpoint.count({ where: filteredWhere }),
        prisma.webhookEndpoint.count({
          where: { ...baseWhere, status: 'ACTIVE' },
        }),
        prisma.webhookEndpoint.count({
          where: { ...baseWhere, status: 'PAUSED' },
        }),
        prisma.webhookEndpoint.count({
          where: { ...baseWhere, status: 'AUTO_DISABLED' },
        }),
        prisma.webhookEndpoint.count({ where: baseWhere }),
      ]);

    return {
      items: rows.map(webhookEndpointPrismaToDomain),
      total,
      count: {
        active: countActive,
        paused: countPaused,
        autoDisabled: countAutoDisabled,
        total: totalAll,
      },
    };
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    return prisma.webhookEndpoint.count({
      where: {
        tenantId,
        deletedAt: null,
        status: { not: 'AUTO_DISABLED' },
      },
    });
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateWebhookEndpointPatch,
  ): Promise<void> {
    const updateData: Prisma.WebhookEndpointUpdateInput = {};
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.subscribedEvents !== undefined)
      updateData.subscribedEvents = { set: data.subscribedEvents };
    if (data.status !== undefined)
      updateData.status = data.status as PrismaWebhookEndpointStatus;
    if (data.autoDisabledReason !== undefined)
      updateData.autoDisabledReason =
        (data.autoDisabledReason as PrismaWebhookAutoDisableReason | null) ??
        null;
    if (data.autoDisabledAt !== undefined)
      updateData.autoDisabledAt = data.autoDisabledAt;
    if (data.consecutiveDeadCount !== undefined)
      updateData.consecutiveDeadCount = data.consecutiveDeadCount;
    if (data.secretCurrent !== undefined)
      updateData.secretCurrent = data.secretCurrent;
    if (data.secretCurrentLast4 !== undefined)
      updateData.secretCurrentLast4 = data.secretCurrentLast4;
    if (data.secretCurrentCreatedAt !== undefined)
      updateData.secretCurrentCreatedAt = data.secretCurrentCreatedAt;
    if (data.secretPrevious !== undefined)
      updateData.secretPrevious = data.secretPrevious;
    if (data.secretPreviousExpiresAt !== undefined)
      updateData.secretPreviousExpiresAt = data.secretPreviousExpiresAt;
    if (data.lastSuccessAt !== undefined)
      updateData.lastSuccessAt = data.lastSuccessAt;
    if (data.lastDeliveryAt !== undefined)
      updateData.lastDeliveryAt = data.lastDeliveryAt;
    if (data.deletedAt !== undefined) updateData.deletedAt = data.deletedAt;

    await prisma.webhookEndpoint.updateMany({
      where: { id, tenantId },
      data: updateData,
    });
  }

  async incrementDeadCount(
    id: string,
    tenantId: string,
  ): Promise<{ newCount: number }> {
    // Atomic increment via SQL — sobrevive concurrent worker dispatch (Pitfall 6)
    const updated = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        consecutiveDeadCount: { increment: 1 },
        lastDeliveryAt: new Date(),
      },
      select: { consecutiveDeadCount: true, tenantId: true },
    });

    if (updated.tenantId !== tenantId) {
      // Defensive: never happens via repo contract (caller validated tenantId)
      throw new Error('tenant mismatch');
    }

    return { newCount: updated.consecutiveDeadCount };
  }

  async resetDeadCount(id: string, tenantId: string): Promise<void> {
    const now = new Date();
    await prisma.webhookEndpoint.updateMany({
      where: { id, tenantId },
      data: {
        consecutiveDeadCount: 0,
        lastSuccessAt: now,
        lastDeliveryAt: now,
      },
    });
  }

  async autoDisable(
    id: string,
    tenantId: string,
    reason: PrismaWebhookAutoDisableReason,
  ): Promise<void> {
    await prisma.webhookEndpoint.updateMany({
      where: { id, tenantId },
      data: {
        status: 'AUTO_DISABLED',
        autoDisabledReason: reason,
        autoDisabledAt: new Date(),
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.webhookEndpoint.updateMany({
      where: { id, tenantId },
      data: { deletedAt: new Date() },
    });
  }

  async cleanupExpiredPreviousSecrets(): Promise<number> {
    const now = new Date();
    const result = await prisma.webhookEndpoint.updateMany({
      where: {
        secretPreviousExpiresAt: { lt: now },
      },
      data: {
        secretPrevious: null,
        secretPreviousExpiresAt: null,
      },
    });
    return result.count;
  }
}
