import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import {
  InventorySession,
  type InventorySessionMode,
  type InventorySessionStatus,
} from '@/entities/stock/inventory-session';
import {
  InventorySessionItem,
  type DivergenceResolution,
  type InventorySessionItemStatus,
} from '@/entities/stock/inventory-session-item';
import type {
  InventorySession as PrismaInventorySession,
  InventorySessionItem as PrismaInventorySessionItem,
} from '@prisma/generated/client.js';

export function inventorySessionPrismaToDomain(
  raw: PrismaInventorySession,
): InventorySession {
  return InventorySession.create(
    {
      tenantId: new EntityID(raw.tenantId),
      userId: new EntityID(raw.userId),
      mode: raw.mode as InventorySessionMode,
      status: raw.status as InventorySessionStatus,
      binId: raw.binId ? new EntityID(raw.binId) : undefined,
      zoneId: raw.zoneId ? new EntityID(raw.zoneId) : undefined,
      productId: raw.productId ? new EntityID(raw.productId) : undefined,
      variantId: raw.variantId ? new EntityID(raw.variantId) : undefined,
      totalItems: raw.totalItems,
      scannedItems: raw.scannedItems,
      confirmedItems: raw.confirmedItems,
      divergentItems: raw.divergentItems,
      notes: raw.notes ?? undefined,
      startedAt: raw.startedAt,
      completedAt: raw.completedAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}

export function inventorySessionItemPrismaToDomain(
  raw: PrismaInventorySessionItem,
): InventorySessionItem {
  return InventorySessionItem.create(
    {
      sessionId: new EntityID(raw.sessionId),
      itemId: new EntityID(raw.itemId),
      expectedBinId: raw.expectedBinId
        ? new EntityID(raw.expectedBinId)
        : undefined,
      actualBinId: raw.actualBinId
        ? new EntityID(raw.actualBinId)
        : undefined,
      status: raw.status as InventorySessionItemStatus,
      scannedAt: raw.scannedAt ?? undefined,
      resolution: raw.resolution
        ? (raw.resolution as DivergenceResolution)
        : undefined,
      resolvedBy: raw.resolvedBy
        ? new EntityID(raw.resolvedBy)
        : undefined,
      resolvedAt: raw.resolvedAt ?? undefined,
      notes: raw.notes ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new EntityID(raw.id),
  );
}
