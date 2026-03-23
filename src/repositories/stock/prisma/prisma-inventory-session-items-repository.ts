import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  InventorySessionItem,
  type InventorySessionItemStatus,
  type DivergenceResolution,
} from '@/entities/stock/inventory-session-item';
import { prisma } from '@/lib/prisma';
import type {
  CreateInventorySessionItemSchema,
  InventorySessionItemsRepository,
} from '../inventory-session-items-repository';

interface SessionItemRow {
  id: string;
  sessionId: string;
  itemId: string;
  expectedBinId: string | null;
  actualBinId: string | null;
  status: string;
  scannedAt: Date | null;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapToEntity(row: SessionItemRow): InventorySessionItem {
  return InventorySessionItem.create(
    {
      sessionId: new UniqueEntityID(row.sessionId),
      itemId: new UniqueEntityID(row.itemId),
      expectedBinId: row.expectedBinId
        ? new UniqueEntityID(row.expectedBinId)
        : undefined,
      actualBinId: row.actualBinId
        ? new UniqueEntityID(row.actualBinId)
        : undefined,
      status: row.status as InventorySessionItemStatus,
      scannedAt: row.scannedAt ?? undefined,
      resolution: row.resolution
        ? (row.resolution as DivergenceResolution)
        : undefined,
      resolvedBy: row.resolvedBy
        ? new UniqueEntityID(row.resolvedBy)
        : undefined,
      resolvedAt: row.resolvedAt ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    new UniqueEntityID(row.id),
  );
}

export class PrismaInventorySessionItemsRepository
  implements InventorySessionItemsRepository
{
  async create(
    data: CreateInventorySessionItemSchema,
  ): Promise<InventorySessionItem> {
    const row = await prisma.inventorySessionItem.create({
      data: {
        sessionId: data.sessionId.toString(),
        itemId: data.itemId.toString(),
        expectedBinId: data.expectedBinId?.toString() ?? null,
        actualBinId: data.actualBinId?.toString() ?? null,
        status: data.status ?? 'PENDING',
        notes: data.notes ?? null,
      },
    });

    return mapToEntity(row);
  }

  async createMany(
    data: CreateInventorySessionItemSchema[],
  ): Promise<InventorySessionItem[]> {
    const rows = await prisma.$transaction(
      data.map((d) =>
        prisma.inventorySessionItem.create({
          data: {
            sessionId: d.sessionId.toString(),
            itemId: d.itemId.toString(),
            expectedBinId: d.expectedBinId?.toString() ?? null,
            actualBinId: d.actualBinId?.toString() ?? null,
            status: d.status ?? 'PENDING',
            notes: d.notes ?? null,
          },
        }),
      ),
    );

    return rows.map(mapToEntity);
  }

  async findById(id: UniqueEntityID): Promise<InventorySessionItem | null> {
    const row = await prisma.inventorySessionItem.findUnique({
      where: { id: id.toString() },
    });

    if (!row) return null;
    return mapToEntity(row);
  }

  async findBySessionAndItem(
    sessionId: UniqueEntityID,
    itemId: UniqueEntityID,
  ): Promise<InventorySessionItem | null> {
    const row = await prisma.inventorySessionItem.findFirst({
      where: {
        sessionId: sessionId.toString(),
        itemId: itemId.toString(),
      },
    });

    if (!row) return null;
    return mapToEntity(row);
  }

  async findManyBySession(
    sessionId: UniqueEntityID,
  ): Promise<InventorySessionItem[]> {
    const rows = await prisma.inventorySessionItem.findMany({
      where: { sessionId: sessionId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map(mapToEntity);
  }

  async save(item: InventorySessionItem): Promise<void> {
    await prisma.inventorySessionItem.update({
      where: { id: item.id.toString() },
      data: {
        expectedBinId: item.expectedBinId?.toString() ?? null,
        actualBinId: item.actualBinId?.toString() ?? null,
        status: item.status,
        scannedAt: item.scannedAt ?? null,
        resolution: item.resolution ?? null,
        resolvedBy: item.resolvedBy?.toString() ?? null,
        resolvedAt: item.resolvedAt ?? null,
        notes: item.notes ?? null,
        updatedAt: new Date(),
      },
    });
  }
}
