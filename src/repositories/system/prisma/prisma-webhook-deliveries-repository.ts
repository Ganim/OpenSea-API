/**
 * Prisma WebhookDelivery repository — Phase 11 / Plan 11-02.
 */
import type {
  AttemptLog,
  WebhookDelivery,
} from '@/entities/system/webhook-delivery';
import { prisma } from '@/lib/prisma';
import { webhookDeliveryPrismaToDomain } from '@/mappers/system/webhook-delivery/webhook-delivery-prisma-to-domain';
import type {
  Prisma,
  WebhookDeliveryStatus as PrismaWebhookDeliveryStatus,
  WebhookErrorClass as PrismaWebhookErrorClass,
} from '@prisma/generated/client.js';

import type {
  FindWebhookDeliveriesParams,
  FindWebhookDeliveriesResult,
  UpdateWebhookDeliveryPatch,
  WebhookDeliveriesRepository,
} from '../webhook-deliveries-repository';

export class PrismaWebhookDeliveriesRepository implements WebhookDeliveriesRepository {
  async create(delivery: WebhookDelivery): Promise<void> {
    await prisma.webhookDelivery.create({
      data: {
        id: delivery.id.toString(),
        tenantId: delivery.tenantId.toString(),
        endpointId: delivery.endpointId.toString(),
        eventId: delivery.eventId,
        eventType: delivery.eventType,
        status: delivery.status as PrismaWebhookDeliveryStatus,
        attemptCount: delivery.attemptCount,
        manualReprocessCount: delivery.manualReprocessCount,
        lastManualReprocessAt: delivery.lastManualReprocessAt ?? null,
        lastAttemptAt: delivery.lastAttemptAt ?? null,
        lastHttpStatus: delivery.lastHttpStatus ?? null,
        lastErrorClass:
          (delivery.lastErrorClass as PrismaWebhookErrorClass | null) ?? null,
        lastErrorMessage: delivery.lastErrorMessage ?? null,
        lastDurationMs: delivery.lastDurationMs ?? null,
        lastResponseBody: delivery.lastResponseBody ?? null,
        lastRetryAfterSeconds: delivery.lastRetryAfterSeconds ?? null,
        attempts: delivery.attempts as unknown as Prisma.InputJsonValue,
        payloadHash: delivery.payloadHash,
        createdAt: delivery.createdAt,
      },
    });
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<WebhookDelivery | null> {
    const raw = await prisma.webhookDelivery.findFirst({
      where: { id, tenantId },
    });
    return raw ? webhookDeliveryPrismaToDomain(raw) : null;
  }

  async findByEventAndEndpoint(
    eventId: string,
    endpointId: string,
  ): Promise<WebhookDelivery | null> {
    const raw = await prisma.webhookDelivery.findFirst({
      where: { eventId, endpointId },
    });
    return raw ? webhookDeliveryPrismaToDomain(raw) : null;
  }

  async findAll(
    params: FindWebhookDeliveriesParams,
  ): Promise<FindWebhookDeliveriesResult> {
    const baseWhere: Prisma.WebhookDeliveryWhereInput = {
      tenantId: params.tenantId,
      endpointId: params.endpointId,
    };

    const filteredWhere: Prisma.WebhookDeliveryWhereInput = { ...baseWhere };
    if (params.status) {
      filteredWhere.status = params.status as PrismaWebhookDeliveryStatus;
    }
    if (params.createdAfter || params.createdBefore) {
      filteredWhere.createdAt = {};
      if (params.createdAfter)
        filteredWhere.createdAt.gte = params.createdAfter;
      if (params.createdBefore)
        filteredWhere.createdAt.lte = params.createdBefore;
    }
    if (params.eventType) {
      filteredWhere.eventType = params.eventType;
    }
    if (params.httpStatus !== undefined) {
      filteredWhere.lastHttpStatus = params.httpStatus;
    }

    const [rows, total, cPending, cDelivered, cFailed, cDead, cTotal] =
      await Promise.all([
        prisma.webhookDelivery.findMany({
          where: filteredWhere,
          orderBy: { createdAt: 'desc' },
          skip: params.offset,
          take: params.limit,
        }),
        prisma.webhookDelivery.count({ where: filteredWhere }),
        prisma.webhookDelivery.count({
          where: { ...baseWhere, status: 'PENDING' },
        }),
        prisma.webhookDelivery.count({
          where: { ...baseWhere, status: 'DELIVERED' },
        }),
        prisma.webhookDelivery.count({
          where: { ...baseWhere, status: 'FAILED' },
        }),
        prisma.webhookDelivery.count({
          where: { ...baseWhere, status: 'DEAD' },
        }),
        prisma.webhookDelivery.count({ where: baseWhere }),
      ]);

    return {
      items: rows.map(webhookDeliveryPrismaToDomain),
      total,
      count: {
        pending: cPending,
        delivered: cDelivered,
        failed: cFailed,
        dead: cDead,
        total: cTotal,
      },
    };
  }

  async update(
    id: string,
    tenantId: string,
    data: UpdateWebhookDeliveryPatch,
  ): Promise<void> {
    const updateData: Prisma.WebhookDeliveryUpdateInput = {};
    if (data.status !== undefined)
      updateData.status = data.status as PrismaWebhookDeliveryStatus;
    if (data.attemptCount !== undefined)
      updateData.attemptCount = data.attemptCount;
    if (data.manualReprocessCount !== undefined)
      updateData.manualReprocessCount = data.manualReprocessCount;
    if (data.lastManualReprocessAt !== undefined)
      updateData.lastManualReprocessAt = data.lastManualReprocessAt;
    if (data.lastAttemptAt !== undefined)
      updateData.lastAttemptAt = data.lastAttemptAt;
    if (data.lastHttpStatus !== undefined)
      updateData.lastHttpStatus = data.lastHttpStatus;
    if (data.lastErrorClass !== undefined)
      updateData.lastErrorClass =
        (data.lastErrorClass as PrismaWebhookErrorClass | null) ?? null;
    if (data.lastErrorMessage !== undefined)
      updateData.lastErrorMessage = data.lastErrorMessage;
    if (data.lastDurationMs !== undefined)
      updateData.lastDurationMs = data.lastDurationMs;
    if (data.lastResponseBody !== undefined)
      updateData.lastResponseBody = data.lastResponseBody;
    if (data.lastRetryAfterSeconds !== undefined)
      updateData.lastRetryAfterSeconds = data.lastRetryAfterSeconds;

    await prisma.webhookDelivery.updateMany({
      where: { id, tenantId },
      data: updateData,
    });
  }

  async appendAttempt(
    id: string,
    tenantId: string,
    attempt: AttemptLog,
  ): Promise<void> {
    // Read-modify-write — Prisma não tem JSON array push nativo no client.
    // Em volume baixo (<1KB JSON) o pattern é seguro; concurrent updates
    // em mesma delivery são raros (1 worker por jobId).
    const row = await prisma.webhookDelivery.findFirst({
      where: { id, tenantId },
      select: { attempts: true, attemptCount: true },
    });
    if (!row) return;
    const current = Array.isArray(row.attempts)
      ? (row.attempts as unknown as AttemptLog[])
      : [];
    const next = [...current, attempt];
    await prisma.webhookDelivery.updateMany({
      where: { id, tenantId },
      data: {
        attempts: next as unknown as Prisma.InputJsonValue,
        attemptCount: next.length,
      },
    });
  }

  async incrementManualReprocess(
    id: string,
    tenantId: string,
  ): Promise<{ newCount: number; lastReprocessAt: Date }> {
    const now = new Date();
    const updated = await prisma.webhookDelivery.update({
      where: { id },
      data: {
        manualReprocessCount: { increment: 1 },
        lastManualReprocessAt: now,
      },
      select: {
        manualReprocessCount: true,
        lastManualReprocessAt: true,
        tenantId: true,
      },
    });
    if (updated.tenantId !== tenantId) {
      throw new Error('tenant mismatch');
    }
    return {
      newCount: updated.manualReprocessCount,
      lastReprocessAt: updated.lastManualReprocessAt ?? now,
    };
  }

  async cleanupDeadOlderThan(date: Date): Promise<number> {
    const result = await prisma.webhookDelivery.deleteMany({
      where: {
        status: 'DEAD',
        createdAt: { lt: date },
      },
    });
    return result.count;
  }
}
