import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PosTerminal } from '@/entities/sales/pos-terminal';
import { prisma } from '@/lib/prisma';
import { posTerminalPrismaToDomain } from '@/mappers/sales/pos-terminal/pos-terminal-prisma-to-domain';
import type { PaginatedResult } from '@/repositories/pagination-params';
import type {
  FindManyPosTerminalsPaginatedParams,
  PosTerminalsRepository,
} from '../pos-terminals-repository';
import type {
  Prisma,
  PosTerminalMode as PrismaMode,
  PosCashierMode as PrismaCashierMode,
} from '@prisma/generated/client.js';

export class PrismaPosTerminalsRepository implements PosTerminalsRepository {
  async create(terminal: PosTerminal): Promise<void> {
    await prisma.posTerminal.create({
      data: {
        id: terminal.id.toString(),
        tenantId: terminal.tenantId.toString(),
        name: terminal.name,
        deviceId: terminal.deviceId,
        mode: terminal.mode as PrismaMode,
        cashierMode: terminal.cashierMode as PrismaCashierMode,
        acceptsPendingOrders: terminal.acceptsPendingOrders,
        warehouseId: terminal.warehouseId.toString(),
        defaultPriceTableId: terminal.defaultPriceTableId?.toString() ?? null,
        isActive: terminal.isActive,
        lastSyncAt: terminal.lastSyncAt ?? null,
        lastOnlineAt: terminal.lastOnlineAt ?? null,
        settings: (terminal.settings as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PosTerminal | null> {
    const raw = await prisma.posTerminal.findFirst({
      where: { id: id.toString(), tenantId },
    });
    return raw ? posTerminalPrismaToDomain(raw) : null;
  }

  async findByDeviceId(
    deviceId: string,
    tenantId: string,
  ): Promise<PosTerminal | null> {
    const raw = await prisma.posTerminal.findFirst({
      where: { deviceId, tenantId },
    });
    return raw ? posTerminalPrismaToDomain(raw) : null;
  }

  async findManyPaginated(
    params: FindManyPosTerminalsPaginatedParams,
  ): Promise<PaginatedResult<PosTerminal>> {
    const where: Record<string, unknown> = { tenantId: params.tenantId };

    if (params.search) {
      where.name = { contains: params.search, mode: 'insensitive' };
    }
    if (params.mode) {
      where.mode = params.mode;
    }
    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [data, total] = await Promise.all([
      prisma.posTerminal.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          [params.sortBy || 'createdAt']: params.sortOrder || 'desc',
        },
      }),
      prisma.posTerminal.count({ where }),
    ]);

    return {
      data: data.map(posTerminalPrismaToDomain),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async save(terminal: PosTerminal): Promise<void> {
    await prisma.posTerminal.update({
      where: { id: terminal.id.toString() },
      data: {
        name: terminal.name,
        deviceId: terminal.deviceId,
        mode: terminal.mode as PrismaMode,
        cashierMode: terminal.cashierMode as PrismaCashierMode,
        acceptsPendingOrders: terminal.acceptsPendingOrders,
        warehouseId: terminal.warehouseId.toString(),
        defaultPriceTableId: terminal.defaultPriceTableId?.toString() ?? null,
        isActive: terminal.isActive,
        lastSyncAt: terminal.lastSyncAt ?? null,
        lastOnlineAt: terminal.lastOnlineAt ?? null,
        settings: (terminal.settings as Prisma.InputJsonValue) ?? undefined,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.posTerminal.delete({
      where: { id: id.toString(), tenantId },
    });
  }
}
