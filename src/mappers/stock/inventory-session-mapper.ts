import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
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
import type {
  InventorySession as PrismaInventorySession,
  InventorySessionItem as PrismaInventorySessionItem,
  Prisma,
} from '@prisma/generated/client.js';

export function inventorySessionPrismaToDomain(
  raw: PrismaInventorySession,
): InventorySession {
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

export function inventorySessionToPersistence(
  session: InventorySession,
): Prisma.InventorySessionUncheckedCreateInput {
  return {
    id: session.id.toString(),
    tenantId: session.tenantId.toString(),
    mode: session.mode,
    status: session.status,
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
  };
}

export function inventorySessionItemPrismaToDomain(
  raw: PrismaInventorySessionItem,
): InventorySessionItem {
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

export function inventorySessionItemToPersistence(
  item: InventorySessionItem,
): Prisma.InventorySessionItemUncheckedCreateInput {
  return {
    id: item.id.toString(),
    sessionId: item.sessionId,
    itemId: item.itemId ?? null,
    binId: item.binId,
    status: item.status,
    resolution: item.resolution ?? null,
    notes: item.notes ?? null,
    scannedAt: item.scannedAt ?? null,
    resolvedAt: item.resolvedAt ?? null,
    resolvedBy: item.resolvedBy ?? null,
  };
}
