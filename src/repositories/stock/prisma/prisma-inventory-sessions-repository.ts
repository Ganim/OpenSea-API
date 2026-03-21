import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  InventorySession,
  type InventorySessionMode,
  type InventorySessionStatus,
} from '@/entities/stock/inventory-session';
import { prisma } from '@/lib/prisma';
import type {
  PaginatedResult,
  PaginationParams,
} from '../../pagination-params';
import type {
  CreateInventorySessionSchema,
  InventorySessionFilters,
  InventorySessionsRepository,
} from '../inventory-sessions-repository';

interface InventorySessionRow {
  id: string;
  tenantId: string;
  userId: string;
  status: string;
  mode: string;
  binId: string | null;
  zoneId: string | null;
  productId: string | null;
  variantId: string | null;
  totalItems: number;
  scannedItems: number;
  confirmedItems: number;
  divergentItems: number;
  notes: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapToEntity(row: InventorySessionRow): InventorySession {
  return InventorySession.create(
    {
      tenantId: new UniqueEntityID(row.tenantId),
      userId: new UniqueEntityID(row.userId),
      status: row.status as InventorySessionStatus,
      mode: row.mode as InventorySessionMode,
      binId: row.binId ? new UniqueEntityID(row.binId) : undefined,
      zoneId: row.zoneId ? new UniqueEntityID(row.zoneId) : undefined,
      productId: row.productId ? new UniqueEntityID(row.productId) : undefined,
      variantId: row.variantId ? new UniqueEntityID(row.variantId) : undefined,
      totalItems: row.totalItems,
      scannedItems: row.scannedItems,
      confirmedItems: row.confirmedItems,
      divergentItems: row.divergentItems,
      notes: row.notes ?? undefined,
      startedAt: row.startedAt,
      completedAt: row.completedAt ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    new UniqueEntityID(row.id),
  );
}

export class PrismaInventorySessionsRepository
  implements InventorySessionsRepository
{
  async create(data: CreateInventorySessionSchema): Promise<InventorySession> {
    const row = await prisma.inventorySession.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId.toString(),
        mode: data.mode,
        binId: data.binId?.toString() ?? null,
        zoneId: data.zoneId?.toString() ?? null,
        productId: data.productId?.toString() ?? null,
        variantId: data.variantId?.toString() ?? null,
        totalItems: data.totalItems ?? 0,
        notes: data.notes ?? null,
      },
    });

    return mapToEntity(row);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<InventorySession | null> {
    const row = await prisma.inventorySession.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!row) return null;
    return mapToEntity(row);
  }

  async findActiveByScope(
    tenantId: string,
    mode: InventorySessionMode,
    scopeId: UniqueEntityID,
  ): Promise<InventorySession | null> {
    const scopeIdStr = scopeId.toString();

    const scopeFilter: Record<string, string> = {};
    switch (mode) {
      case 'BIN':
        scopeFilter.binId = scopeIdStr;
        break;
      case 'ZONE':
        scopeFilter.zoneId = scopeIdStr;
        break;
      case 'PRODUCT':
        // Could be productId or variantId
        break;
    }

    const row = await prisma.inventorySession.findFirst({
      where: {
        tenantId,
        mode,
        status: { in: ['OPEN', 'PAUSED'] },
        ...(mode === 'PRODUCT'
          ? {
              OR: [{ productId: scopeIdStr }, { variantId: scopeIdStr }],
            }
          : scopeFilter),
      },
    });

    if (!row) return null;
    return mapToEntity(row);
  }

  async findManyPaginated(
    tenantId: string,
    params: PaginationParams,
    filters?: InventorySessionFilters,
  ): Promise<PaginatedResult<InventorySession>> {
    const where: Record<string, unknown> = { tenantId };
    if (filters?.status) where.status = filters.status;
    if (filters?.mode) where.mode = filters.mode;

    const [rows, total] = await Promise.all([
      prisma.inventorySession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      prisma.inventorySession.count({ where }),
    ]);

    return {
      data: rows.map(mapToEntity),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(session: InventorySession): Promise<void> {
    await prisma.inventorySession.update({
      where: { id: session.id.toString() },
      data: {
        status: session.status,
        totalItems: session.totalItems,
        scannedItems: session.scannedItems,
        confirmedItems: session.confirmedItems,
        divergentItems: session.divergentItems,
        notes: session.notes ?? null,
        completedAt: session.completedAt ?? null,
        updatedAt: new Date(),
      },
    });
  }
}
