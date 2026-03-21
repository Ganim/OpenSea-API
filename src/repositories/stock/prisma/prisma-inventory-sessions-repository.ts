import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  InventorySession,
  type InventorySessionMode,
  type InventorySessionStatus,
} from '@/entities/stock/inventory-session';
import {
  InventorySessionItem,
  type InventoryItemResolution,
  type InventoryItemStatus,
} from '@/entities/stock/inventory-session-item';
import { prisma } from '@/lib/prisma';
import type {
  InventorySessionMode as PrismaSessionMode,
  InventorySessionStatus as PrismaSessionStatus,
  InventoryItemStatus as PrismaItemStatus,
  InventoryItemResolution as PrismaItemResolution,
  Prisma,
} from '@prisma/generated/client.js';

import type { InventorySessionsRepository } from '../inventory-sessions-repository';

export class PrismaInventorySessionsRepository
  implements InventorySessionsRepository
{
  private toDomainSession(raw: {
    id: string;
    mode: PrismaSessionMode;
    status: PrismaSessionStatus;
    scope: unknown;
    totalItems: number;
    confirmedItems: number;
    divergences: number;
    notes: string | null;
    startedAt: Date;
    pausedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    deletedAt: Date | null;
    startedBy: string;
    tenantId: string;
  }): InventorySession {
    return InventorySession.create(
      {
        tenantId: new EntityID(raw.tenantId),
        mode: raw.mode as InventorySessionMode,
        status: raw.status as InventorySessionStatus,
        scope: raw.scope as Record<string, unknown>,
        totalItems: raw.totalItems,
        confirmedItems: raw.confirmedItems,
        divergences: raw.divergences,
        notes: raw.notes ?? undefined,
        startedAt: raw.startedAt,
        pausedAt: raw.pausedAt ?? undefined,
        completedAt: raw.completedAt ?? undefined,
        createdAt: raw.createdAt,
        deletedAt: raw.deletedAt ?? undefined,
        startedBy: raw.startedBy,
      },
      new EntityID(raw.id),
    );
  }

  private toDomainItem(raw: {
    id: string;
    sessionId: string;
    itemId: string | null;
    binId: string;
    status: PrismaItemStatus;
    resolution: PrismaItemResolution | null;
    notes: string | null;
    scannedAt: Date | null;
    resolvedAt: Date | null;
    resolvedBy: string | null;
    createdAt: Date;
  }): InventorySessionItem {
    return InventorySessionItem.create(
      {
        sessionId: raw.sessionId,
        itemId: raw.itemId ?? undefined,
        binId: raw.binId,
        status: raw.status as InventoryItemStatus,
        resolution: (raw.resolution as InventoryItemResolution) ?? undefined,
        notes: raw.notes ?? undefined,
        scannedAt: raw.scannedAt ?? undefined,
        resolvedAt: raw.resolvedAt ?? undefined,
        resolvedBy: raw.resolvedBy ?? undefined,
        createdAt: raw.createdAt,
      },
      new EntityID(raw.id),
    );
  }

  async create(session: InventorySession): Promise<InventorySession> {
    const raw = await prisma.inventorySession.create({
      data: {
        id: session.id.toString(),
        tenantId: session.tenantId.toString(),
        mode: session.mode as PrismaSessionMode,
        status: session.status as PrismaSessionStatus,
        scope: session.scope as Prisma.InputJsonValue,
        totalItems: session.totalItems,
        confirmedItems: session.confirmedItems,
        divergences: session.divergences,
        notes: session.notes ?? null,
        startedAt: session.startedAt,
        pausedAt: session.pausedAt ?? null,
        completedAt: session.completedAt ?? null,
        createdAt: session.createdAt,
        deletedAt: session.deletedAt ?? null,
        startedBy: session.startedBy,
      },
    });

    return this.toDomainSession(raw);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InventorySession | null> {
    const raw = await prisma.inventorySession.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!raw) return null;
    return this.toDomainSession(raw);
  }

  async findActiveByScope(
    scope: Record<string, string>,
    tenantId: string,
  ): Promise<InventorySession | null> {
    const raw = await prisma.inventorySession.findFirst({
      where: {
        tenantId,
        status: { in: ['OPEN', 'PAUSED'] },
        deletedAt: null,
        // JSON containment check for scope
        scope: { equals: scope as Prisma.InputJsonValue },
      },
    });

    if (!raw) return null;
    return this.toDomainSession(raw);
  }

  async list(params: {
    tenantId: string;
    status?: string;
    mode?: string;
    page?: number;
    perPage?: number;
  }): Promise<{ sessions: InventorySession[]; total: number }> {
    const page = params.page ?? 1;
    const perPage = params.perPage ?? 20;

    const where: Prisma.InventorySessionWhereInput = {
      tenantId: params.tenantId,
      deletedAt: null,
      ...(params.status && {
        status: params.status as PrismaSessionStatus,
      }),
      ...(params.mode && {
        mode: params.mode as PrismaSessionMode,
      }),
    };

    const [sessions, total] = await Promise.all([
      prisma.inventorySession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.inventorySession.count({ where }),
    ]);

    return {
      sessions: sessions.map((s) => this.toDomainSession(s)),
      total,
    };
  }

  async save(session: InventorySession): Promise<void> {
    await prisma.inventorySession.update({
      where: { id: session.id.toString() },
      data: {
        status: session.status as PrismaSessionStatus,
        totalItems: session.totalItems,
        confirmedItems: session.confirmedItems,
        divergences: session.divergences,
        notes: session.notes ?? null,
        pausedAt: session.pausedAt ?? null,
        completedAt: session.completedAt ?? null,
        deletedAt: session.deletedAt ?? null,
      },
    });
  }

  async createItem(
    item: InventorySessionItem,
  ): Promise<InventorySessionItem> {
    const raw = await prisma.inventorySessionItem.create({
      data: {
        id: item.id.toString(),
        sessionId: item.sessionId,
        itemId: item.itemId ?? null,
        binId: item.binId,
        status: item.status as PrismaItemStatus,
        resolution: (item.resolution as PrismaItemResolution) ?? null,
        notes: item.notes ?? null,
        scannedAt: item.scannedAt ?? null,
        resolvedAt: item.resolvedAt ?? null,
        resolvedBy: item.resolvedBy ?? null,
      },
    });

    return this.toDomainItem(raw);
  }

  async findItemsBySessionId(
    sessionId: string,
  ): Promise<InventorySessionItem[]> {
    const items = await prisma.inventorySessionItem.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
    });

    return items.map((item) => this.toDomainItem(item));
  }

  async saveItem(item: InventorySessionItem): Promise<void> {
    await prisma.inventorySessionItem.update({
      where: { id: item.id.toString() },
      data: {
        status: item.status as PrismaItemStatus,
        resolution: (item.resolution as PrismaItemResolution) ?? null,
        notes: item.notes ?? null,
        scannedAt: item.scannedAt ?? null,
        resolvedAt: item.resolvedAt ?? null,
        resolvedBy: item.resolvedBy ?? null,
      },
    });
  }
}
